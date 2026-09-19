import { useState } from "react";
import { refundSale } from "./refundActions";

export default function SalesLog({ sales, onRefunded, onSelect }) {
  const [busyId, setBusyId] = useState(null);

  const sorted = [...sales].sort((a, b) => b.createdAt - a.createdAt);

  async function handleRefund(sale) {
    if (!confirm(`Refund this $${sale.total.toFixed(2)} sale?`)) return;
    setBusyId(sale.id);
    try {
      await refundSale(sale.id);
      onRefunded();
    } catch (err) {
      console.error("Refund failed:", err);
      alert("Could not refund. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (sorted.length === 0) {
    return <p style={{ color: "#888" }}>No sales in this period.</p>;
  }

  return (
    <div style={styles.list}>
      {sorted.map((sale) => (
        <div key={sale.id} style={styles.row} onClick={() => onSelect(sale)}>
          <div>
            <div style={styles.time}>{new Date(sale.createdAt).toLocaleString()}</div>
            <div style={styles.itemsLine}>
              {sale.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
            </div>
          </div>

          <div style={styles.rightSide}>
            <div style={sale.refunded ? styles.refundedTotal : styles.total}>
              ${sale.total.toFixed(2)}
              {sale.refunded && <span style={styles.refundedTag}> Refunded</span>}
              {sale.locked && <span style={styles.lockedTag}> Locked</span>}
            </div>
            {!sale.refunded && !sale.locked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefund(sale);
                }}
                disabled={busyId === sale.id}
                style={styles.refundBtn}
              >
                {busyId === sale.id ? "..." : "Refund"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    border: "1px solid #eee",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
  },
  time: { fontSize: 12, color: "#888" },
  itemsLine: { fontSize: 14, marginTop: 2 },
  rightSide: { display: "flex", alignItems: "center", gap: 10 },
  total: { fontWeight: "bold" },
  refundedTotal: { fontWeight: "bold", color: "#999", textDecoration: "line-through" },
  refundedTag: {
    marginLeft: 6,
    fontSize: 11,
    color: "#c0392b",
    textDecoration: "none",
    fontWeight: "normal",
  },
  lockedTag: {
    marginLeft: 6,
    fontSize: 11,
    color: "#888",
    textDecoration: "none",
    fontWeight: "normal",
  },
  refundBtn: {
    background: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
  },
};