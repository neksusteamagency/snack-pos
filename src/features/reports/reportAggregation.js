// src/reports/reportAggregation.js

// Rolls up multiple dayClose documents (each already a locked, closed
// summary) into one combined summary for a longer period.
export function aggregateDayCloses(dayCloses) {
  let revenue = 0;
  let transactionCount = 0;
  let refundedCount = 0;
  let refundedAmount = 0;
  let expensesTotal = 0;
  let expensesCount = 0;
  const itemsMap = {};

  for (const close of dayCloses) {
    revenue += close.totals?.revenue ?? 0;
    transactionCount += close.totals?.transactionCount ?? 0;
    refundedCount += close.totals?.refundedCount ?? 0;
    refundedAmount += close.totals?.refundedAmount ?? 0;
    expensesTotal += close.expensesTotal ?? 0;
    expensesCount += close.expensesCount ?? 0;

    for (const item of close.itemBreakdown ?? []) {
      if (!itemsMap[item.name]) itemsMap[item.name] = { qty: 0, revenue: 0 };
      itemsMap[item.name].qty += item.qty;
      itemsMap[item.name].revenue += item.revenue;
    }
  }

  const itemBreakdown = Object.entries(itemsMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty);

  return {
    revenue,
    transactionCount,
    refundedCount,
    refundedAmount,
    avgSale: transactionCount ? revenue / transactionCount : 0,
    itemsSoldCount: itemBreakdown.reduce((sum, i) => sum + i.qty, 0),
    itemBreakdown,
    expensesTotal,
    expensesCount,
    profit: revenue - expensesTotal,
    closeCount: dayCloses.length,
  };
}
