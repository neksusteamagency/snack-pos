// src/reports/DayEndReports.jsx
import { useMemo, useState } from "react";
import { useDayCloses } from "./useDayCloses";
import { exportCsv } from "./exportCsv";
import { formatUSD, formatLBP } from "../../lib/currency";

function fmtDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(ms) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function DayEndReports({ reloadToken, onRefresh }) {
  const { dayCloses, loading, error } = useDayCloses(reloadToken);
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => dayCloses.find((d) => d.id === selectedId) ?? dayCloses[0] ?? null,
    [dayCloses, selectedId]
  );

  function handleExportSelected() {
    if (!selected) return;
    const rows = [
      ["End of Day Report", fmtDate(selected.dateKey)],
      ["Closed By", selected.closedBy ?? ""],
      ["Closed At", new Date(selected.closedAt).toLocaleString()],
      [],
      ["Revenue", formatUSD(selected.totals?.revenue ?? 0), formatLBP(selected.totals?.revenue ?? 0)],
      ["Transactions", selected.totals?.transactionCount ?? 0],
      ["Average Sale", formatUSD(selected.totals?.avgSale ?? 0), formatLBP(selected.totals?.avgSale ?? 0)],
      ["Refunds", selected.totals?.refundedCount ?? 0],
      [
        "Refunded Amount",
        formatUSD(selected.totals?.refundedAmount ?? 0),
        formatLBP(selected.totals?.refundedAmount ?? 0),
      ],
      ["Expenses", formatUSD(selected.expensesTotal ?? 0), formatLBP(selected.expensesTotal ?? 0)],
      ["Profit", formatUSD(selected.profit ?? 0), formatLBP(selected.profit ?? 0)],
      [],
      ["Item", "Qty Sold", "Revenue (USD)", "Revenue (LBP)"],
      ...(selected.itemBreakdown ?? []).map((i) => [i.name, i.qty, formatUSD(i.revenue), formatLBP(i.revenue)]),
    ];
    exportCsv(rows, `day-end-report-${selected.dateKey}.csv`);
  }

  if (loading) return <p>Loading end-of-day reports...</p>;
  if (error) return <p style={{ color: "var(--color-danger)" }}>{error}</p>;

  if (dayCloses.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyTitle}>No end-of-day reports yet.</p>
        <p style={styles.emptyText}>
          A report is generated automatically each time a cashier closes the day from the register.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.listCol} className="no-print">
        <div style={styles.listHeader}>
          <span>Past Reports</span>
          <button onClick={onRefresh} style={styles.refreshBtn} title="Refresh list">
            ⟳
          </button>
        </div>
        <div style={styles.list}>
          {dayCloses.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              style={{
                ...styles.listItem,
                ...(selected?.id === d.id ? styles.listItemActive : {}),
              }}
            >
              <div style={styles.listItemDate}>{fmtDate(d.dateKey)}</div>
              <div style={styles.listItemMeta}>
                {formatUSD(d.totals?.revenue ?? 0)} · {d.totals?.transactionCount ?? 0} sales
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div style={styles.detailCol} id="printable-report">
          <div style={styles.detailHeader}>
            <div>
              <h3 style={styles.detailTitle}>{fmtDate(selected.dateKey)}</h3>
              <p style={styles.detailSub}>
                Closed by {selected.closedBy || "unknown"} at {fmtTime(selected.closedAt)}
              </p>
            </div>
            <div style={styles.detailActions} className="no-print">
              <button onClick={handleExportSelected} style={styles.actionBtn}>
                Export CSV
              </button>
              <button onClick={() => window.print()} style={styles.actionBtn}>
                Print
              </button>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <StatCard
              label="Revenue"
              value={formatUSD(selected.totals?.revenue ?? 0)}
              sub={formatLBP(selected.totals?.revenue ?? 0)}
            />
            <StatCard label="Transactions" value={selected.totals?.transactionCount ?? 0} />
            <StatCard
              label="Avg Sale"
              value={formatUSD(selected.totals?.avgSale ?? 0)}
              sub={formatLBP(selected.totals?.avgSale ?? 0)}
            />
            <StatCard
              label="Refunds"
              value={`${selected.totals?.refundedCount ?? 0} · ${formatUSD(selected.totals?.refundedAmount ?? 0)}`}
              sub={formatLBP(selected.totals?.refundedAmount ?? 0)}
            />
            <StatCard
              label="Expenses"
              value={formatUSD(selected.expensesTotal ?? 0)}
              sub={formatLBP(selected.expensesTotal ?? 0)}
            />
            <StatCard
              label="Profit"
              value={formatUSD(selected.profit ?? 0)}
              sub={formatLBP(selected.profit ?? 0)}
              highlight={(selected.profit ?? 0) >= 0 ? "good" : "bad"}
            />
          </div>

          <h4 style={styles.sectionTitle}>Item Breakdown</h4>
          {(selected.itemBreakdown ?? []).length === 0 ? (
            <p style={styles.emptyText}>No items sold this day.</p>
          ) : (
            <div style={styles.breakdownList}>
              {selected.itemBreakdown.map((item, i) => {
                const max = selected.itemBreakdown[0]?.qty || 1;
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
        </div>
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
  wrap: { display: "flex", gap: 16, marginTop: 12, alignItems: "flex-start" },
  listCol: {
    width: 220,
    flexShrink: 0,
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    overflow: "hidden",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--color-ink-muted)",
    borderBottom: "1px solid var(--color-border)",
  },
  refreshBtn: {
    border: "none",
    background: "none",
    fontSize: 14,
    cursor: "pointer",
    color: "var(--color-ink-muted)",
  },
  list: { display: "flex", flexDirection: "column", maxHeight: 480, overflowY: "auto" },
  listItem: {
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid var(--color-border)",
    background: "transparent",
  },
  listItemActive: { background: "var(--color-bg)", borderLeft: "3px solid var(--color-accent)" },
  listItemDate: { fontSize: 13, fontWeight: 700, color: "var(--color-ink)" },
  listItemMeta: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 2 },

  detailCol: {
    flex: 1,
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: 20,
  },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  detailTitle: { margin: 0, fontSize: 18, color: "var(--color-ink)" },
  detailSub: { margin: "4px 0 0", fontSize: 13, color: "var(--color-ink-muted)" },
  detailActions: { display: "flex", gap: 8 },
  actionBtn: {
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    padding: 14,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
  },
  statLabel: { fontSize: 12, color: "var(--color-ink-muted)", fontWeight: 600, textTransform: "uppercase" },
  statValue: { fontSize: 20, fontWeight: 700, color: "var(--color-ink)", marginTop: 4 },
  statSub: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 10px" },
  breakdownList: { display: "flex", flexDirection: "column", gap: 8 },
  breakdownRow: { display: "flex", alignItems: "center", gap: 10 },
  rank: {
    width: 20,
    fontSize: 12,
    fontWeight: 700,
    color: "var(--color-ink-muted)",
    textAlign: "center",
  },
  breakdownMain: { flex: 1 },
  breakdownTop: { display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 },
  breakdownName: { fontWeight: 600, color: "var(--color-ink)" },
  breakdownNumsWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  breakdownNums: { color: "var(--color-ink-muted)" },
  breakdownNumsLbp: { color: "var(--color-ink-muted)", fontSize: 11, opacity: 0.85 },
  barTrack: {
    height: 6,
    borderRadius: 4,
    background: "var(--color-border)",
    overflow: "hidden",
  },
  barFill: { height: "100%", background: "var(--color-accent)" },

  empty: { padding: "40px 0", textAlign: "center" },
  emptyTitle: { fontSize: 15, fontWeight: 700, color: "var(--color-ink)" },
  emptyText: { fontSize: 13, color: "var(--color-ink-muted)" },
};