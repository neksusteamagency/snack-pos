// src/owner/MenuManager.jsx
import { useState } from "react";
import { useMenu } from "../cashier/useMenu";
import { useCategories } from "./useCategories";
import MenuItemForm from "./MenuItemForm";
import CategoryManager from "./CategoryManager";
import { formatUSD, formatLBP } from "../../lib/currency";

export default function MenuManager() {
  const { items, loading } = useMenu();
  const { categories, loading: categoriesLoading } = useCategories();
  const [editingItem, setEditingItem] = useState(undefined); // undefined = closed, null = add new, object = edit
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  if (loading || categoriesLoading) return <p style={styles.loading}>Loading menu...</p>;

  const itemsByCategory = categories.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.name),
  }));

  const uncategorized = items.filter((i) => !categories.some((c) => c.name === i.category));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={styles.header}>
        <h2 style={styles.title}>Menu</h2>
        <div style={styles.headerActions}>
          <button onClick={() => setShowCategoryManager(true)} style={styles.secondaryBtn}>
            Manage Categories
          </button>
          <button
            onClick={() => setEditingItem(null)}
            style={styles.addBtn}
            disabled={categories.length === 0}
            title={categories.length === 0 ? "Add a category first" : ""}
          >
            + Add item
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <p style={styles.hint}>No categories yet — add one to start building your menu.</p>
      )}

      {itemsByCategory.map((cat) => (
        <div key={cat.id} style={styles.section}>
          <h3 style={styles.sectionTitle}>{cat.name}</h3>
          {cat.items.length === 0 ? (
            <p style={styles.emptyText}>No items in this category yet.</p>
          ) : (
            <div style={styles.list}>
              {cat.items.map((item) => (
                <button key={item.id} style={styles.row} onClick={() => setEditingItem(item)}>
                  <span>{item.name}</span>
                  <span style={styles.rowPriceWrap}>
                    <span style={styles.rowPrice}>{formatUSD(item.price)}</span>
                    <span style={styles.rowPriceLbp}>{formatLBP(item.price)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Uncategorized</h3>
          <div style={styles.list}>
            {uncategorized.map((item) => (
              <button key={item.id} style={styles.row} onClick={() => setEditingItem(item)}>
                <span>{item.name}</span>
                <span style={styles.rowPriceWrap}>
                  <span style={styles.rowPrice}>{formatUSD(item.price)}</span>
                  <span style={styles.rowPriceLbp}>{formatLBP(item.price)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingItem !== undefined && <MenuItemForm item={editingItem} onClose={() => setEditingItem(undefined)} />}
      {showCategoryManager && <CategoryManager onClose={() => setShowCategoryManager(false)} />}
    </div>
  );
}

const styles = {
  loading: { color: "var(--color-ink-muted)", padding: "20px 0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, color: "var(--color-ink)" },
  headerActions: { display: "flex", gap: 8 },
  secondaryBtn: {
    background: "var(--color-surface)",
    color: "var(--color-ink)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
  },
  addBtn: {
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
  },
  hint: { fontSize: 13, color: "var(--color-ink-muted)", marginTop: 12 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "var(--color-ink-muted)",
    marginBottom: 8,
  },
  emptyText: { fontSize: 13, color: "var(--color-ink-muted)" },
  list: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--color-ink)",
  },
  rowPriceWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  rowPrice: { color: "var(--color-ink)", fontWeight: 600 },
  rowPriceLbp: { color: "var(--color-ink-muted)", fontWeight: 500, fontSize: 12 },
};