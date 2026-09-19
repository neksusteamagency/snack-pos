// src/expenses/ExpensesView.jsx
import { useState } from "react";
import { useExpenses } from "./useExpenses";
import { useExpenseItems } from "./useExpenseItems";
import { addExpense, deleteExpense } from "./expenseActions";
import { addExpenseItem } from "./expenseItemActions";
import { formatUSD, formatLBP, lbpToUsd } from "../../lib/currency";

const ADD_NEW_VALUE = "__add_new__";

export default function ExpensesView() {
  const [reloadToken, setReloadToken] = useState(0);
  const { expenses, loading, error } = useExpenses(undefined, undefined, reloadToken);
  const { expenseItems, loading: itemsLoading } = useExpenseItems();

  const [selectedItem, setSelectedItem] = useState("");
  const [addingNewItem, setAddingNewItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountCurrency, setAmountCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const numericAmountPreview = parseFloat(amount);
  const hasValidAmountPreview = amount !== "" && !isNaN(numericAmountPreview) && numericAmountPreview >= 0;

  function switchCurrency(next) {
    if (next === amountCurrency) return;
    const numeric = parseFloat(amount);
    if (!isNaN(numeric)) {
      if (next === "LBP") {
        setAmount(Math.round(numeric * 90000).toString());
      } else {
        setAmount((numeric / 90000).toFixed(2));
      }
    }
    setAmountCurrency(next);
  }

  function handleSelectChange(e) {
    const value = e.target.value;
    if (value === ADD_NEW_VALUE) {
      setAddingNewItem(true);
      setSelectedItem("");
    } else {
      setAddingNewItem(false);
      setSelectedItem(value);
    }
    setFormError("");
  }

  async function handleAdd() {
    setFormError("");
    const rawNumeric = parseFloat(amount);

    if (isNaN(rawNumeric) || rawNumeric <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    // Always store in USD, regardless of which currency was typed
    const numericAmount =
      amountCurrency === "USD" ? rawNumeric : Math.round(lbpToUsd(rawNumeric) * 100) / 100;

    setSaving(true);
    try {
      let description = selectedItem;

      if (addingNewItem) {
        const trimmed = newItemName.trim();
        if (!trimmed) {
          setFormError("Enter a name for the new expense item.");
          setSaving(false);
          return;
        }
        await addExpenseItem(trimmed);
        description = trimmed;
      }

      if (!description) {
        setFormError("Choose an expense item.");
        setSaving(false);
        return;
      }

      await addExpense({ description, amount: numericAmount });
      setSelectedItem("");
      setNewItemName("");
      setAddingNewItem(false);
      setAmount("");
      setReloadToken((t) => t + 1);
    } catch (err) {
      console.error("Add expense failed:", err);
      setFormError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    if (!confirm(`Delete "${expense.description}"?`)) return;
    setBusyId(expense.id);
    try {
      await deleteExpense(expense.id);
      setReloadToken((t) => t + 1);
    } catch (err) {
      console.error("Delete expense failed:", err);
      alert("Could not delete. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={styles.title}>Expenses</h2>

      <div style={styles.form}>
        {addingNewItem ? (
          <input
            style={styles.input}
            placeholder="New expense item name"
            value={newItemName}
            autoFocus
            onChange={(e) => setNewItemName(e.target.value)}
          />
        ) : (
          <select style={styles.input} value={selectedItem} onChange={handleSelectChange}>
            <option value="" disabled>
              {itemsLoading ? "Loading items..." : "Select expense item"}
            </option>
            {expenseItems.map((it) => (
              <option key={it.id} value={it.name}>
                {it.name}
              </option>
            ))}
            <option value={ADD_NEW_VALUE}>+ Add new expense item...</option>
          </select>
        )}

        <div style={styles.amountBlock}>
          <div style={styles.currencyToggle}>
            <button
              type="button"
              onClick={() => switchCurrency("USD")}
              style={{ ...styles.currencyBtn, ...(amountCurrency === "USD" ? styles.currencyBtnActive : {}) }}
            >
              $
            </button>
            <button
              type="button"
              onClick={() => switchCurrency("LBP")}
              style={{ ...styles.currencyBtn, ...(amountCurrency === "LBP" ? styles.currencyBtnActive : {}) }}
            >
              LBP
            </button>
          </div>
          <input
            style={{ ...styles.input, width: 130 }}
            type="number"
            step={amountCurrency === "USD" ? "0.01" : "1000"}
            placeholder={amountCurrency === "USD" ? "e.g. 5.00" : "e.g. 450000"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <button onClick={handleAdd} disabled={saving} style={styles.addBtn}>
          {saving ? "Adding..." : "Add"}
        </button>
      </div>
      {hasValidAmountPreview && (
        <p style={styles.amountPreview}>
          ≈{" "}
          {amountCurrency === "USD"
            ? formatLBP(numericAmountPreview)
            : formatUSD(lbpToUsd(numericAmountPreview))}
        </p>
      )}
      {addingNewItem && (
        <button
          onClick={() => {
            setAddingNewItem(false);
            setNewItemName("");
          }}
          style={styles.linkBtn}
        >
          ← Choose from list instead
        </button>
      )}
      {formError && <p style={styles.error}>{formError}</p>}

      <h3 style={styles.subTitle}>All Expenses</h3>
      {loading && <p style={styles.emptyText}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && !error && expenses.length === 0 && <p style={styles.emptyText}>No expenses recorded yet.</p>}

      <div style={styles.list}>
        {expenses.map((exp) => (
          <div key={exp.id} style={styles.row}>
            <div>
              <div style={styles.rowName}>{exp.description}</div>
              <div style={styles.time}>{new Date(exp.createdAt).toLocaleString()}</div>
            </div>
            <div style={styles.rightSide}>
              <div style={styles.amountWrap}>
                <div style={styles.amount}>{formatUSD(exp.amount)}</div>
                <div style={styles.amountLbp}>{formatLBP(exp.amount)}</div>
              </div>
              <button onClick={() => handleDelete(exp)} disabled={busyId === exp.id} style={styles.deleteBtn}>
                {busyId === exp.id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  title: { margin: 0, color: "var(--color-ink)" },
  subTitle: { color: "var(--color-ink)", marginTop: 20 },
  form: { display: "flex", gap: 8, marginTop: 12, alignItems: "flex-start" },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 15,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
  },
  amountBlock: { display: "flex", flexDirection: "column", gap: 4 },
  currencyToggle: { display: "flex", gap: 4 },
  currencyBtn: {
    flex: 1,
    padding: "4px 8px",
    fontSize: 11,
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
  amountPreview: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 6 },
  addBtn: {
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "var(--color-ink-muted)",
    fontSize: 12,
    marginTop: 6,
    cursor: "pointer",
    padding: 0,
  },
  error: { color: "var(--color-danger)", fontSize: 14, marginTop: 8 },
  emptyText: { color: "var(--color-ink-muted)", fontSize: 14 },
  list: { display: "flex", flexDirection: "column", gap: 8, marginTop: 12 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
  },
  rowName: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)" },
  time: { fontSize: 12, color: "var(--color-ink-muted)", marginTop: 2 },
  rightSide: { display: "flex", alignItems: "center", gap: 10 },
  amountWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  amount: { fontWeight: 700, color: "var(--color-ink)" },
  amountLbp: { fontSize: 11, color: "var(--color-ink-muted)" },
  deleteBtn: {
    background: "var(--color-danger)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius)",
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 700,
  },
};