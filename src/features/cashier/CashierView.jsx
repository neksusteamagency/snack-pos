import { useMemo, useState } from "react";
import { useMenu } from "./useMenu";
import { useAuth } from "../auth/AuthContext";
import { checkoutSale } from "./checkout";
import AdminCodeModal from "../admin/AdminCodeModal";
import RefundsView from "./RefundsView";
import { closeDay } from "../reports/dayClose";
import { dateKeyFor, todayKey, useDayClose } from "../reports/useDayClose";
import { useOpenPeriod } from "../reports/useOpenPeriod";
import { formatUSD, formatLBP } from "../../lib/currency";

const CATEGORY_COLORS = [
  { bg: "#f2a93b", text: "#4a2e00" },
  { bg: "#2fa8a0", text: "#ffffff" },
  { bg: "#7c6fe0", text: "#ffffff" },
  { bg: "#e0607e", text: "#ffffff" },
  { bg: "#5aa8e0", text: "#0b2540" },
  { bg: "#8bc34a", text: "#1b3400" },
  { bg: "#e0a5c9", text: "#4a0f2e" },
  { bg: "#c9a24a", text: "#3a2600" },
];

export default function CashierView() {
  const { items, loading } = useMenu();
  const { session } = useAuth();
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [showRefunds, setShowRefunds] = useState(false);
  const [closingDay, setClosingDay] = useState(false);
  const [view, setView] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // periodStart = when the current (still open) business period began,
  // i.e. the last time someone pressed End Day. null = never closed yet.
  const { periodStart } = useOpenPeriod();
  const { closeInfo } = useDayClose(todayKey());

  const categories = useMemo(() => {
    const seen = [];
    for (const item of items) {
      if (item.category && !seen.includes(item.category)) seen.push(item.category);
    }
    return seen;
  }, [items]);

  const categoryColors = useMemo(() => {
    const map = {};
    categories.forEach((cat, i) => {
      map[cat] = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });
    return map;
  }, [categories]);

  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  }

  function removeOne(id) {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (confirm("Clear the current order?")) setCart([]);
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  async function handleCheckout() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setMessage("");

    checkoutSale({ items: cart, total, cashier: session.name }).catch((err) => {
      console.error("Checkout failed:", err);
    });

    setCart([]);
    setMessage("Sale recorded.");
    setSubmitting(false);
    setTimeout(() => setMessage(""), 2000);
  }

  async function handleEndDay() {
    if (closingDay) return;
    if (!confirm("End the day? Orders made so far can no longer be edited or refunded after this. New orders will count toward the next report.")) return;
    setClosingDay(true);
    try {
      // Close everything from the last close (or the very beginning, if this
      // is the first ever close) up to right now.
      await closeDay(periodStart ?? 0, Date.now(), dateKeyFor(Date.now()), session.name);
    } catch (err) {
      console.error("End of day failed:", err);
      alert("Could not close the day. Check your connection and try again.");
    } finally {
      setClosingDay(false);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading menu...</p>;

  const itemsInCategory = selectedCategory ? items.filter((i) => i.category === selectedCategory) : [];

  return (
    <div style={styles.layout}>
      {/* Order panel — left, like the reference */}
      <div style={styles.orderPanel}>
        <div style={styles.orderHeader}>Order</div>

        <div style={styles.orderList}>
          {cart.length === 0 ? (
            <p style={styles.emptyCart}>No items yet.</p>
          ) : (
            cart.map((i) => (
              <div key={i.id} style={styles.orderRow}>
                <div style={styles.orderRowLeft}>
                  <span style={styles.orderQty}>{i.qty}</span>
                  <span style={styles.orderName}>{i.name}</span>
                </div>
                <div style={styles.orderRowRight}>
                  <div style={styles.orderTotals}>
                    <span style={styles.orderLineTotal}>{formatUSD(i.price * i.qty)}</span>
                    <span style={styles.orderLineTotalLbp}>{formatLBP(i.price * i.qty)}</span>
                  </div>
                  <button onClick={() => removeOne(i.id)} style={styles.removeBtn}>
                    −
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.totalBar}>
          <span>TOTAL</span>
          <div style={styles.totalAmounts}>
            <span style={styles.totalUsd}>{formatUSD(total)}</span>
            <span style={styles.totalLbp}>{formatLBP(total)}</span>
          </div>
        </div>

        <div style={styles.actionRow}>
          <button onClick={clearCart} style={styles.clearBtn} disabled={cart.length === 0}>
            Clear
          </button>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            style={{
              ...styles.checkoutBtn,
              ...(cart.length === 0 || submitting ? styles.checkoutBtnDisabled : {}),
            }}
          >
            {submitting ? "Processing..." : "Checkout"}
          </button>
        </div>

        {message && <p style={styles.message}>{message}</p>}
      </div>

      {/* Category / item grid — right */}
      <div style={styles.gridArea}>
        {view === "categories" ? (
          <div style={styles.categoryGrid}>
            {categories.map((cat) => {
              const color = categoryColors[cat];
              return (
                <button
                  key={cat}
                  style={{ ...styles.categoryTile, background: color.bg, color: color.text }}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setView("items");
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div style={styles.itemsHeader}>
              <button onClick={() => setView("categories")} style={styles.backBtn}>
                ← Back
              </button>
              <div style={styles.categoryLabel}>
                {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </div>
            </div>
            <div style={styles.grid}>
              {itemsInCategory.map((item) => {
                const color = categoryColors[selectedCategory];
                return (
                  <button
                    key={item.id}
                    style={{ ...styles.key, background: color.bg, color: color.text }}
                    onClick={() => addToCart(item)}
                  >
                    <div style={styles.keyName}>{item.name}</div>
                    <div style={styles.keyPrice}>{formatUSD(item.price)}</div>
                    <div style={styles.keyPriceLbp}>{formatLBP(item.price)}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={styles.cornerActions}>
          <button onClick={() => setShowAdminGate(true)} style={styles.refundBtn}>
            Refund / Orders
          </button>
          {closeInfo && (
            <div style={styles.closeStatus}>
              Last closed today at{" "}
              {new Date(closeInfo.closedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
            </div>
          )}
          <button onClick={handleEndDay} disabled={closingDay} style={styles.endDayBtn}>
            {closingDay ? "Closing..." : "End Day"}
          </button>
        </div>
      </div>

      {showAdminGate && (
        <AdminCodeModal
          onSuccess={() => {
            setShowAdminGate(false);
            setShowRefunds(true);
          }}
          onCancel={() => setShowAdminGate(false)}
        />
      )}
      {showRefunds && <RefundsView onClose={() => setShowRefunds(false)} />}
    </div>
  );
}

const styles = {
  layout: { display: "flex", gap: 2, padding: 16, alignItems: "stretch", minHeight: "calc(100vh - 90px)" },

  orderPanel: {
    width: 300,
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    display: "flex",
    flexDirection: "column",
  },
  orderHeader: {
    padding: "12px 16px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--color-ink-muted)",
    borderBottom: "1px solid var(--color-border)",
  },
  orderList: { flex: 1, overflowY: "auto", padding: "8px 12px" },
  emptyCart: { fontSize: 14, color: "var(--color-ink-muted)", textAlign: "center", padding: "24px 0" },
  orderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 4px",
    borderBottom: "1px solid var(--color-border)",
  },
  orderRowLeft: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
  orderQty: {
    background: "var(--color-accent)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: "var(--radius)",
    minWidth: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },
  orderName: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)" },
  orderRowRight: { display: "flex", alignItems: "center", gap: 8 },
  orderTotals: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  orderLineTotal: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)" },
  orderLineTotalLbp: { fontSize: 11, color: "var(--color-ink-muted)" },
  removeBtn: {
    width: 22,
    height: 22,
    lineHeight: "20px",
    padding: 0,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink-muted)",
    fontSize: 14,
  },

  totalBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--color-ink)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    padding: "12px 16px",
  },
  totalAmounts: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  totalUsd: { fontSize: 18, fontWeight: 700 },
  totalLbp: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)" },
  actionRow: { display: "flex", gap: 2, padding: 8 },
  clearBtn: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    fontWeight: 700,
    background: "var(--color-bg)",
    color: "var(--color-ink-muted)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
  },
  checkoutBtn: {
    flex: 2,
    padding: 14,
    fontSize: 15,
    fontWeight: 700,
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
  },
  checkoutBtnDisabled: {
    background: "var(--color-border)",
    color: "var(--color-ink-muted)",
  },
  message: {
    fontSize: 13,
    color: "var(--color-success)",
    textAlign: "center",
    padding: "0 0 10px",
    margin: 0,
  },

  gridArea: {
    flex: 1,
    position: "relative",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "8px 8px 84px",
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridAutoRows: 110,
    gap: 12,
  },
  categoryTile: {
    border: "none",
    borderRadius: "var(--radius)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
  },

  itemsHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: {
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridAutoRows: 78,
    gap: 10,
  },
  key: {
    border: "none",
    borderRadius: "var(--radius)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: 6,
    textAlign: "center",
  },
  keyName: { fontSize: 16, fontWeight: 700, lineHeight: 1.2 },
  keyPrice: { fontSize: 14, fontWeight: 600, opacity: 0.9 },
  keyPriceLbp: { fontSize: 11, fontWeight: 500, opacity: 0.75 },
  categoryLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--color-ink)",
  },

  cornerActions: {
    position: "absolute",
    bottom: 12,
    right: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  closeStatus: {
    fontSize: 11,
    color: "var(--color-ink-muted)",
    textAlign: "center",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "4px 6px",
  },
  refundBtn: {
    width: 150,
    height: 60,
    fontSize: 14,
    fontWeight: 700,
    background: "var(--color-danger)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
  },
  endDayBtn: {
    width: 150,
    height: 44,
    fontSize: 13,
    fontWeight: 700,
    background: "var(--color-ink)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
  },
};