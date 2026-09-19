import { useState } from "react";
import { updateSale, refundSale } from "./refundActions";

export default function EditSaleModal({ sale, onClose, onSaved }) {
  const [items, setItems] = useState(sale.items.map((i) => ({ ...i })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const locked = !!sale.locked;
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  function updateQty(id, delta) {
    if (locked) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateSale(sale.id, { items, total });
      onSaved();
    } catch (err) {
      console.error("Edit save failed:", err);
      setError("Could not save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefund() {
    if (!confirm(`Refund this $${sale.total.toFixed(2)} sale?`)) return;
    setSaving(true);
    try {
      await refundSale(sale.id);
      onSaved();
    } catch (err) {
      console.error("Refund failed:", err);
      setError("Could not refund. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span>{locked ? "Order (Locked)" : "Edit Order"}</span>
          <button onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>

        {locked && (
          <p style={styles.lockedNotice}>
            This order is from a closed day and can no longer be edited or refunded.
          </p>
        )}

        <div style={styles.itemList}>
          {items.length === 0 ? (
            <p style={styles.empty}>No items left.</p>
          ) : (
            items.map((i) => (
              <div key={i.id} style={styles.itemRow}>
                <span style={styles.itemName}>{i.name}</span>
                <div style={styles.qtyControls}>
                  <button onClick={() => updateQty(i.id, -1)} disabled={locked} style={styles.qtyBtn}>
                    −
                  </button>
                  <span style={styles.qty}>{i.qty}</span>
                  <button onClick={() => updateQty(i.id, 1)} disabled={locked} style={styles.qtyBtn}>
                    +
                  </button>
                </div>
                <span style={styles.itemTotal}>${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.totalRow}>
          <span>{locked ? "Total" : "New Total"}</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!locked && (
          <div style={styles.actions}>
            {!sale.refunded && (
              <button onClick={handleRefund} disabled={saving} style={styles.refundAllBtn}>
                Refund Entire Order
              </button>
            )}
            <button onClick={handleSave} disabled={saving || items.length === 0} style={styles.saveBtn}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,20,30,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "var(--color-surface)",
    borderRadius: "var(--radius)",
    width: 420,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    background: "var(--color-ink)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
  },
  closeBtn: {
    padding: "6px 12px",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "var(--radius)",
    background: "transparent",
    color: "#fff",
    fontSize: 13,
  },
  lockedNotice: {
    margin: "12px 18px 0",
    padding: "10px 12px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 13,
    color: "var(--color-ink-muted)",
  },
  itemList: { padding: "12px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  empty: { fontSize: 14, color: "var(--color-ink-muted)", textAlign: "center", padding: "16px 0" },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  itemName: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)", flex: 1 },
  qtyControls: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
    fontSize: 15,
  },
  qty: { fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: "center" },
  itemTotal: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)", width: 56, textAlign: "right" },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderTop: "1px solid var(--color-border)",
    fontSize: 15,
    fontWeight: 700,
    color: "var(--color-ink)",
  },
  error: { fontSize: 13, color: "var(--color-danger)", textAlign: "center", margin: "0 18px" },
  actions: { display: "flex", flexDirection: "column", gap: 8, padding: "12px 18px 18px" },
  refundAllBtn: {
    padding: 12,
    border: "1px solid var(--color-danger)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-danger)",
    fontWeight: 700,
  },
  saveBtn: {
    padding: 12,
    border: "none",
    borderRadius: "var(--radius)",
    background: "var(--color-accent)",
    color: "#fff",
    fontWeight: 700,
  },
};