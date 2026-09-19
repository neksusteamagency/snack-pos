// src/owner/MenuItemForm.jsx
import { useState } from "react";
import { addMenuItem, updateMenuItem, deleteMenuItem } from "./menuActions";
import { useCategories } from "./useCategories";
import { formatLBP, formatUSD, lbpToUsd } from "../../lib/currency";

// item = null means "add new"; item = {id, name, price, category} means "edit"
export default function MenuItemForm({ item, onClose }) {
  const { categories } = useCategories();
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [priceCurrency, setPriceCurrency] = useState("USD"); // what currency the price field is in right now
  const [category, setCategory] = useState(item?.category ?? categories[0]?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const numericPricePreview = parseFloat(price);
  const hasValidPricePreview = price !== "" && !isNaN(numericPricePreview) && numericPricePreview >= 0;

  function switchCurrency(next) {
    if (next === priceCurrency) return;
    // Carry the value over converted, so switching units doesn't lose what was typed
    const numeric = parseFloat(price);
    if (!isNaN(numeric)) {
      if (next === "LBP") {
        setPrice(Math.round(numeric * 90000).toString());
      } else {
        setPrice((numeric / 90000).toFixed(2));
      }
    }
    setPriceCurrency(next);
  }

  async function handleSave() {
    setError("");
    const trimmedName = name.trim();
    const rawNumeric = parseFloat(price);

    if (!trimmedName) {
      setError("Enter a name.");
      return;
    }
    if (isNaN(rawNumeric) || rawNumeric < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!category) {
      setError("Choose a category.");
      return;
    }

    // Always store in USD, regardless of which currency was typed
    const numericPrice =
      priceCurrency === "USD" ? rawNumeric : Math.round(lbpToUsd(rawNumeric) * 100) / 100;

    setSaving(true);
    try {
      if (item) {
        await updateMenuItem(item.id, {
          name: trimmedName,
          price: numericPrice,
          category,
        });
      } else {
        await addMenuItem({ name: trimmedName, price: numericPrice, category });
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"?`)) return;
    setSaving(true);
    try {
      await deleteMenuItem(item.id);
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Could not delete. Try again.");
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <h2 style={styles.heading}>{item ? "Edit item" : "Add item"}</h2>

        <label style={styles.label}>Name</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken Sandwich"
        />

        <label style={styles.label}>Price</label>
        <div style={styles.currencyToggle}>
          <button
            type="button"
            onClick={() => switchCurrency("USD")}
            style={{ ...styles.currencyBtn, ...(priceCurrency === "USD" ? styles.currencyBtnActive : {}) }}
          >
            $ USD
          </button>
          <button
            type="button"
            onClick={() => switchCurrency("LBP")}
            style={{ ...styles.currencyBtn, ...(priceCurrency === "LBP" ? styles.currencyBtnActive : {}) }}
          >
            LBP
          </button>
        </div>
        <input
          style={styles.input}
          type="number"
          step={priceCurrency === "USD" ? "0.01" : "1000"}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={priceCurrency === "USD" ? "e.g. 5.00" : "e.g. 450000"}
        />
        {hasValidPricePreview && (
          <p style={styles.pricePreview}>
            ≈ {priceCurrency === "USD" ? formatLBP(numericPricePreview) : formatUSD(lbpToUsd(numericPricePreview))}
          </p>
        )}

        <label style={styles.label}>Category</label>
        {categories.length === 0 ? (
          <p style={styles.hint}>No categories yet — add one from "Manage Categories" first.</p>
        ) : (
          <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button onClick={onClose} disabled={saving} style={styles.cancelBtn}>
            Cancel
          </button>
          {item && (
            <button onClick={handleDelete} disabled={saving} style={styles.deleteBtn}>
              Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving || categories.length === 0} style={styles.saveBtn}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  panel: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    padding: 24,
    borderRadius: "var(--radius)",
    width: 340,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  },
  heading: { margin: 0, fontSize: 17, color: "var(--color-ink)" },
  label: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "var(--color-ink-muted)",
    marginTop: 14,
  },
  input: {
    padding: 10,
    fontSize: 15,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    marginTop: 6,
    background: "var(--color-bg)",
    color: "var(--color-ink)",
  },
  currencyToggle: { display: "flex", gap: 6, marginTop: 6 },
  currencyBtn: {
    flex: 1,
    padding: "7px 0",
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink-muted)",
  },
  currencyBtnActive: {
    background: "var(--color-accent)",
    color: "#fff",
    borderColor: "var(--color-accent)",
  },
  pricePreview: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 4 },
  hint: { fontSize: 13, color: "var(--color-ink-muted)", marginTop: 6 },
  error: { color: "var(--color-danger)", fontSize: 13, marginTop: 12 },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },
  cancelBtn: {
    background: "var(--color-bg)",
    color: "var(--color-ink-muted)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
  },
  deleteBtn: {
    background: "var(--color-danger)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
  },
  saveBtn: {
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
  },
};