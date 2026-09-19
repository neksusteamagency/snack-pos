// src/reports/PeriodicReports.jsx
import { useMemo, useState } from "react";
import { useDayCloses } from "./useDayCloses";
import { aggregateDayCloses } from "./reportAggregation";
import {
  getWeekRange,
  getMonthRange,
  getQuarterRange,
  getHalfYearRange,
  getYearRange,
  shiftRange,
  formatRangeLabel,
} from "./periodRanges";
import { exportCsv } from "./exportCsv";
import { formatUSD, formatLBP } from "../../lib/currency";

const UNITS = [
  { key: "week", label: "Weekly", getRange: getWeekRange },
  { key: "month", label: "Monthly", getRange: getMonthRange },
  { key: "quarter", label: "Quarterly", getRange: getQuarterRange },
  { key: "half", label: "Half-Yearly", getRange: getHalfYearRange },
  { key: "year", label: "Yearly", getRange: getYearRange },
];

export default function PeriodicReports({ reloadToken }) {
  const { dayCloses, loading, error } = useDayCloses(reloadToken);
  const [unit, setUnit] = useState("week");
  const [range, setRange] = useState(() => getWeekRange());

  function handleUnitChange(key) {
    setUnit(key);
    setRange(UNITS.find((u) => u.key === key).getRange());
  }

  function handleShift(amount) {
    setRange((r) => shiftRange(r, unit, amount));
  }

  function handleJumpToCurrent() {
    setRange(UNITS.find((u) => u.key === unit).getRange());
  }

  const periodCloses = useMemo(
    () => dayCloses.filter((d) => d.closedAt >= range.start && d.closedAt <= range.end),
    [dayCloses, range]
  );

  const summary = useMemo(() => aggregateDayCloses(periodCloses), [periodCloses]);
  const unitLabel = UNITS.find((u) => u.key === unit).label;

  function handleExportCsv() {
    const rows = [
      [`${unitLabel} Report`, formatRangeLabel(range, unit)],
      ["Based on", `${summary.closeCount} end-of-day report${summary.closeCount === 1 ? "" : "s"}`],
      [],
      ["Revenue", formatUSD(summary.revenue), formatLBP(summary.revenue)],
      ["Transactions", summary.transactionCount],
      ["Average Sale", formatUSD(summary.avgSale), formatLBP(summary.avgSale)],
      ["Refunds", summary.refundedCount],
      ["Refunded Amount", formatUSD(summary.refundedAmount), formatLBP(summary.refundedAmount)],
      ["Expenses", formatUSD(summary.expensesTotal), formatLBP(summary.expensesTotal)],
      ["Profit", formatUSD(summary.profit), formatLBP(summary.profit)],
      [],
      ["Item", "Qty Sold", "Revenue (USD)", "Revenue (LBP)"],
      ...summary.itemBreakdown.map((i) => [i.name, i.qty, formatUSD(i.revenue), formatLBP(i.revenue)]),
    ];
    exportCsv(rows, `${unit}-report-${formatRangeLabel(range, unit).replace(/\s+/g, "-")}.csv`);
  }

  if (loading) return <p>Loading reports...</p>;
  if (error) return <p style={{ color: "var(--color-danger)" }}>{error}</p>;

  return (
    <div id="printable-report">
      <div style={styles.filterBar} className="no-print">
        <div style={styles.unitRow}>
          {UNITS.map((u) => (
            <button
              key={u.key}
              onClick={() => handleUnitChange(u.key)}
              style={{ ...styles.unitBtn, ...(unit === u.key ? styles.unitBtnActive : {}) }}
            >
              {u.label}
            </button>
          ))}
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

      <div style={styles.rangeNav} className="no-print">
        <button onClick={() => handleShift(-1)} style={styles.navBtn}>
          ← Prev
        </button>
        <div style={styles.rangeLabelWrap}>
          <span style={styles.rangeLabel}>{formatRangeLabel(range, unit)}</span>
          <button onClick={handleJumpToCurrent} style={styles.thisBtn}>
            Jump to current
          </button>
        </div>
        <button onClick={() => handleShift(1)} style={styles.navBtn}>
          Next →
        </button>
      </div>

      <p style={styles.basedOn}>
        Based on {summary.closeCount} end-of-day report{summary.closeCount === 1 ? "" : "s"} in this period.
      </p>

      {periodCloses.length === 0 ? (
        <p style={styles.emptyText}>No end-of-day reports fall in this period.</p>
      ) : (
        <>
          <div style={styles.summaryGrid}>
            <StatCard label="Revenue" value={formatUSD(summary.revenue)} sub={formatLBP(summary.revenue)} />
            <StatCard label="Transactions" value={summary.transactionCount} />
            <StatCard label="Avg Sale" value={formatUSD(summary.avgSale)} sub={formatLBP(summary.avgSale)} />
            <StatCard
              label="Refunds"
              value={`${summary.refundedCount} · ${formatUSD(summary.refundedAmount)}`}
              sub={formatLBP(summary.refundedAmount)}
            />
            <StatCard
              label="Expenses"
              value={formatUSD(summary.expensesTotal)}
              sub={formatLBP(summary.expensesTotal)}
            />
            <StatCard
              label="Profit"
              value={formatUSD(summary.profit)}
              sub={formatLBP(summary.profit)}
              highlight={summary.profit >= 0 ? "good" : "bad"}
            />
          </div>

          <h3 style={styles.sectionTitle}>Item Breakdown</h3>
          {summary.itemBreakdown.length === 0 ? (
            <p style={styles.emptyText}>No items sold this period.</p>
          ) : (
            <div style={styles.breakdownList}>
              {summary.itemBreakdown.map((item, i) => {
                const max = summary.itemBreakdown[0]?.qty || 1;
                const pct = Math.max(6, Math.round((item.qty / max) * 100));
                return (
                  <div key={item.name} style={styles.breakdownRow}>
                    <span style={styles.rank}>{i + 1}</span>
                    <div style={styles.breakdownMain}>
                      <div style={styles.breakdownTop}>
                        <span style={styles.breakdownName}>{item.name}</span>
                        <div style={styles.breakdownNumsWrap}>
                          <span style={styles.breakdownNums}>
                            {item.qty} sold · {formatUSD(item.revenue)}
                          </span>
                          <span style={styles.breakdownNumsLbp}>{formatLBP(item.revenue)}</span>
                        </div>
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
  );
}

function StatCard({ label, value, sub, highlight }) {
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
      {sub && <div style={styles.statSub}>{sub}</div>}
    </div>
  );
}

const styles = {
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "16px 0 12px",
    flexWrap: "wrap",
    gap: 8,
  },
  unitRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  unitBtn: {
    padding: "8px 14px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    fontSize: 13,
    fontWeight: 600,
  },
  unitBtnActive: { background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-ink)" },
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

  rangeNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "10px 14px",
    marginBottom: 12,
  },
  navBtn: {
    padding: "6px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
    fontSize: 13,
    fontWeight: 600,
  },
  rangeLabelWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  rangeLabel: { fontSize: 15, fontWeight: 700, color: "var(--color-ink)" },
  thisBtn: {
    border: "none",
    background: "none",
    color: "var(--color-accent)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
  },

  basedOn: { fontSize: 12, color: "var(--color-ink-muted)", marginBottom: 12 },
  emptyText: { color: "var(--color-ink-muted)" },

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 },
  statCard: {
    padding: 16,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
  },
  statLabel: { fontSize: 12, color: "var(--color-ink-muted)", fontWeight: 600, textTransform: "uppercase" },
  statValue: { fontSize: 22, fontWeight: 700, color: "var(--color-ink)", marginTop: 4 },
  statSub: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 2 },

  sectionTitle: { color: "var(--color-ink)" },
  breakdownList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  breakdownRow: { display: "flex", alignItems: "center", gap: 10 },
  rank: { width: 20, fontSize: 12, fontWeight: 700, color: "var(--color-ink-muted)", textAlign: "center" },
  breakdownMain: { flex: 1 },
  breakdownTop: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 },
  breakdownName: { fontWeight: 600, color: "var(--color-ink)" },
  breakdownNumsWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  breakdownNums: { color: "var(--color-ink-muted)" },
  breakdownNumsLbp: { color: "var(--color-ink-muted)", fontSize: 11, opacity: 0.85 },
  barTrack: { height: 6, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" },
  barFill: { height: "100%", background: "var(--color-accent)" },
};
