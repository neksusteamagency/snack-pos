// src/reports/ReportsView.jsx
import { useMemo, useState } from "react";
import { useSales } from "./useSales";
import { useExpenses } from "../expenses/useExpenses";
import { useMenu } from "../cashier/useMenu";
import SalesLog from "./SalesLog";
import EditSaleModal from "./EditSaleModal";
import DayEndReports from "./DayEndReports";
import PeriodicReports from "./PeriodicReports";
import { exportCsv } from "./exportCsv";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toDateInputValue(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

const PRESETS = {
  today: { label: "Today", start: startOfToday },
  week: { label: "This Week", start: startOfWeek },
  month: { label: "This Month", start: startOfMonth },
};

export default function ReportsView() {
  const [tab, setTab] = useState("live"); // "live" | "dayEnd" | "periodic"

  const [preset, setPreset] = useState("today");
  const [customStart, setCustomStart] = useState(toDateInputValue(startOfToday()));
  const [customEnd, setCustomEnd] = useState(toDateInputValue(Date.now()));
  const [category, setCategory] = useState("all");
  const [reloadToken, setReloadToken] = useState(0);
  const [dayEndReloadToken, setDayEndReloadToken] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);

  const startMs =
    preset === "custom" ? new Date(`${customStart}T00:00:00`).getTime() : PRESETS[preset].start();
  const endMs = preset === "custom" ? new Date(`${customEnd}T23:59:59.999`).getTime() : Date.now();

  const { sales, loading, error } = useSales(startMs, endMs, reloadToken);
  const { expenses, loading: expensesLoading } = useExpenses(startMs, endMs, reloadToken);
  const { items: menuItems } = useMenu();

  const categoryById = useMemo(() => {
    const map = {};
    for (const item of menuItems) map[item.id] = item.category;
    return map;
  }, [menuItems]);

  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map((i) => i.category))).filter(Boolean);
  }, [menuItems]);

  const filteredSales = useMemo(() => {
    if (category === "all") return sales;
    return sales.filter((sale) => (sale.items ?? []).some((line) => categoryById[line.id] === category));
  }, [sales, category, categoryById]);

  const stats = useMemo(() => {
    let revenue = 0;
    const items = {};
    let count = 0;
    let refundedCount = 0;
    let refundedAmount = 0;

    for (const sale of sales) {
      const lines = (sale.items ?? []).filter(
        (line) => category === "all" || categoryById[line.id] === category
      );
      if (lines.length === 0) continue;

      if (sale.refunded) {
        refundedCount += 1;
        refundedAmount += sale.total ?? 0;
        continue;
      }

      count += 1;
      for (const line of lines) {
        revenue += line.price * line.qty;
        if (!items[line.name]) items[line.name] = { qty: 0, revenue: 0 };
        items[line.name].qty += line.qty;
        items[line.name].revenue += line.price * line.qty;
      }
    }

    const breakdown = Object.entries(items)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty);

    return {
      totalRevenue: revenue,
      transactionCount: count,
      avgSale: count ? revenue / count : 0,
      refundedCount,
      refundedAmount,
      itemBreakdown: breakdown,
    };
  }, [sales, category, categoryById]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0),
    [expenses]
  );

  const profit = stats.totalRevenue - totalExpenses;

  function handleExportCsv() {
    const rows = [
      ["Reports Export", `${toDateInputValue(startMs)} to ${toDateInputValue(endMs)}`],
      ["Category Filter", category],
      [],
      ["Revenue", `$${stats.totalRevenue.toFixed(2)}`],
      ["Transactions", stats.transactionCount],
      ["Average Sale", `$${stats.avgSale.toFixed(2)}`],
      ["Refunds", stats.refundedCount],
      ["Refunded Amount", `$${stats.refundedAmount.toFixed(2)}`],
      ["Expenses", `$${totalExpenses.toFixed(2)}`],
      ["Profit", `$${profit.toFixed(2)}`],
      [],
      ["Item", "Qty Sold", "Revenue"],
      ...stats.itemBreakdown.map((i) => [i.name, i.qty, `$${i.revenue.toFixed(2)}`]),
      [],
      ["Sale Time", "Items", "Total", "Status"],
      ...[...filteredSales]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((s) => [
          new Date(s.createdAt).toLocaleString(),
          s.items.map((i) => `${i.name} x${i.qty}`).join("; "),
          `$${s.total.toFixed(2)}`,
          s.refunded ? "Refunded" : s.locked ? "Locked" : "Open",
        ]),
    ];
    exportCsv(rows, `sales-report-${toDateInputValue(startMs)}-to-${toDateInputValue(endMs)}.csv`);
  }

  return (
    <div style={styles.page}>
      <style>{PRINT_STYLES}</style>

      <div style={styles.topRow} className="no-print">
        <h2 style={styles.pageTitle}>Reports</h2>
        <div style={styles.tabSwitch}>
          <button
            onClick={() => setTab("live")}
            style={{ ...styles.tabBtn, ...(tab === "live" ? styles.tabBtnActive : {}) }}
          >
            Live Range
          </button>
          <button
            onClick={() => setTab("dayEnd")}
            style={{ ...styles.tabBtn, ...(tab === "dayEnd" ? styles.tabBtnActive : {}) }}
          >
            Day-End Reports
          </button>
          <button
            onClick={() => setTab("periodic")}
            style={{ ...styles.tabBtn, ...(tab === "periodic" ? styles.tabBtnActive : {}) }}
          >
            Weekly / Monthly / ...
          </button>
        </div>
      </div>

      {tab === "dayEnd" && (
        <DayEndReports
          reloadToken={dayEndReloadToken}
          onRefresh={() => setDayEndReloadToken((t) => t + 1)}
        />
      )}

      {tab === "periodic" && <PeriodicReports reloadToken={dayEndReloadToken} />}

      {tab === "live" && (
        <div id="printable-report">
          <div style={styles.filterBar} className="no-print">
            <div style={styles.presetRow}>
              {Object.entries(PRESETS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  style={{ ...styles.presetBtn, ...(preset === key ? styles.presetBtnActive : {}) }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setPreset("custom")}
                style={{ ...styles.presetBtn, ...(preset === "custom" ? styles.presetBtnActive : {}) }}
              >
                Custom
              </button>
            </div>

            <div style={styles.exportRow}>
              <button onClick={handleExportCsv} style={styles.actionBtn}>
                Export CSV
              </button>
              <button onClick={() => window.print()} style={styles.actionBtn}>
                Print
              </button>
            </div>
          </div>

          {preset === "custom" && (
            <div style={styles.customRow} className="no-print">
              <label style={styles.dateLabel}>
                From
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={styles.dateInput}
                />
              </label>
              <label style={styles.dateLabel}>
                To
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={styles.dateInput}
                />
              </label>
              <span style={styles.customHint}>Set both to the same date for a single day.</span>
            </div>
          )}

          <div style={styles.categoryRow} className="no-print">
            <button
              onClick={() => setCategory("all")}
              style={{ ...styles.categoryBtn, ...(category === "all" ? styles.categoryBtnActive : {}) }}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{ ...styles.categoryBtn, ...(category === cat ? styles.categoryBtnActive : {}) }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}s
              </button>
            ))}
          </div>

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          {!loading && !error && (
            <>
              <div style={styles.summaryGrid}>
                <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
                <StatCard label="Transactions" value={stats.transactionCount} />
                <StatCard label="Avg Sale" value={`$${stats.avgSale.toFixed(2)}`} />
                <StatCard
                  label="Refunds"
                  value={`${stats.refundedCount} · $${stats.refundedAmount.toFixed(2)}`}
                />
                <StatCard label="Expenses" value={expensesLoading ? "..." : `$${totalExpenses.toFixed(2)}`} />
                <StatCard
                  label="Profit"
                  value={expensesLoading ? "..." : `$${profit.toFixed(2)}`}
                  highlight={profit >= 0 ? "good" : "bad"}
                />
              </div>

              <h3 style={styles.sectionTitle}>Sales Log</h3>
              <SalesLog
                sales={filteredSales}
                onRefunded={() => setReloadToken((t) => t + 1)}
                onSelect={setSelectedSale}
              />

              <h3 style={styles.sectionTitle}>Item Breakdown</h3>
              {stats.itemBreakdown.length === 0 ? (
                <p style={styles.emptyText}>No sales in this period.</p>
              ) : (
                <div style={styles.breakdownList}>
                  {stats.itemBreakdown.map((item, i) => {
                    const max = stats.itemBreakdown[0]?.qty || 1;
                    const pct = Math.max(6, Math.round((item.qty / max) * 100));
                    return (
                      <div key={item.name} style={styles.breakdownRow}>
                        <span style={styles.rank}>{i + 1}</span>
                        <div style={styles.breakdownMain}>
                          <div style={styles.breakdownTop}>
                            <span style={styles.breakdownName}>{item.name}</span>
                            <span style={styles.breakdownNums}>
                              {item.qty} sold · ${item.revenue.toFixed(2)}
                            </span>
                          </div>
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedSale && (
        <EditSaleModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onSaved={() => {
            setSelectedSale(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div
        style={{
          ...styles.statValue,
          ...(highlight === "good" ? { color: "var(--color-success)" } : {}),
          ...(highlight === "bad" ? { color: "var(--color-danger)" } : {}),
        }}
      >
        {value}
      </div>
    </div>
  );
}

const PRINT_STYLES = `
@media print {
  .no-print { display: none !important; }
}
`;

const styles = {
  page: { marginTop: 16 },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 8 },
  pageTitle: { margin: 0, color: "var(--color-ink)" },
  tabSwitch: {
    display: "flex",
    gap: 4,
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: 4,
    flexWrap: "wrap",
  },
  tabBtn: {
    padding: "7px 14px",
    border: "none",
    background: "none",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--color-ink-muted)",
  },
  tabBtnActive: { background: "var(--color-accent)", color: "#fff" },

  filterBar: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 12px" },
  presetRow: { display: "flex", gap: 8 },
  presetBtn: {
    padding: "8px 14px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: 13,
    fontWeight: 600,
  },
  presetBtnActive: { background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-ink)" },

  exportRow: { display: "flex", gap: 8 },
  actionBtn: {
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
  },

  customRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 },
  dateLabel: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--color-ink-muted)" },
  dateInput: {
    padding: "6px 8px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    background: "var(--color-surface)",
    color: "var(--color-ink)",
  },
  customHint: { fontSize: 12, color: "var(--color-ink-muted)" },

  categoryRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  categoryBtn: {
    padding: "8px 14px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: 13,
    fontWeight: 600,
  },
  categoryBtnActive: { background: "var(--color-accent)", color: "#fff", border: "1px solid var(--color-accent)" },

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 },
  statCard: {
    padding: 16,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
  },
  statLabel: { fontSize: 12, color: "var(--color-ink-muted)", fontWeight: 600, textTransform: "uppercase" },
  statValue: { fontSize: 22, fontWeight: 700, color: "var(--color-ink)", marginTop: 4 },

  sectionTitle: { color: "var(--color-ink)" },
  emptyText: { color: "var(--color-ink-muted)" },

  breakdownList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  breakdownRow: { display: "flex", alignItems: "center", gap: 10 },
  rank: { width: 20, fontSize: 12, fontWeight: 700, color: "var(--color-ink-muted)", textAlign: "center" },
  breakdownMain: { flex: 1 },
  breakdownTop: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 },
  breakdownName: { fontWeight: 600, color: "var(--color-ink)" },
  breakdownNums: { color: "var(--color-ink-muted)" },
  barTrack: { height: 6, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" },
  barFill: { height: "100%", background: "var(--color-accent)" },
};
