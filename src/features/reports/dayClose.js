// src/reports/dayClose.js
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";

function summarizeSales(sales) {
  let revenue = 0;
  let refundedAmount = 0;
  let refundedCount = 0;
  let transactionCount = 0;
  const itemsMap = {};

  for (const sale of sales) {
    if (sale.locked) continue; // already counted in a previous close — skip it

    if (sale.refunded) {
      refundedCount += 1;
      refundedAmount += sale.total ?? 0;
      continue;
    }
    transactionCount += 1;
    revenue += sale.total ?? 0;
    for (const line of sale.items ?? []) {
      if (!itemsMap[line.name]) itemsMap[line.name] = { qty: 0, revenue: 0 };
      itemsMap[line.name].qty += line.qty;
      itemsMap[line.name].revenue += line.price * line.qty;
    }
  }

  const itemBreakdown = Object.entries(itemsMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty);

  return {
    revenue,
    transactionCount,
    refundedAmount,
    refundedCount,
    avgSale: transactionCount ? revenue / transactionCount : 0,
    itemsSoldCount: itemBreakdown.reduce((sum, i) => sum + i.qty, 0),
    itemBreakdown,
  };
}

export async function closeDay(startMs, endMs, dateKey, closedBy) {
  // Pull today's sales
  const salesRef = collection(db, "sales");
  const salesQ = query(salesRef, where("createdAt", ">=", startMs), where("createdAt", "<=", endMs));
  const salesSnap = await getDocs(salesQ);
  const sales = salesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Pull today's expenses so the day-end report includes profit
  const expensesRef = collection(db, "expenses");
  const expensesQ = query(expensesRef, where("createdAt", ">=", startMs), where("createdAt", "<=", endMs));
  const expensesSnap = await getDocs(expensesQ);
  const expenses = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const expensesTotal = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const summary = summarizeSales(sales);

  const batch = writeBatch(db);
  salesSnap.docs.forEach((d) => {
    if (!d.data().locked) batch.update(d.ref, { locked: true });
  });

  // Auto-generated ID instead of dateKey — each close gets its own document,
  // so closing twice in the same day no longer overwrites the first report.
  // dateKey is still stored as a field for grouping/filtering by day.
  const closeRef = doc(collection(db, "dayCloses"));
  batch.set(closeRef, {
    dateKey,
    closedAt: Date.now(),
    closedBy,
    range: { start: startMs, end: endMs },
    totals: {
      revenue: summary.revenue,
      transactionCount: summary.transactionCount,
      refundedCount: summary.refundedCount,
      refundedAmount: summary.refundedAmount,
      avgSale: summary.avgSale,
      itemsSoldCount: summary.itemsSoldCount,
    },
    itemBreakdown: summary.itemBreakdown,
    expensesTotal,
    expensesCount: expenses.length,
    profit: summary.revenue - expensesTotal,
  });

  await batch.commit();
}