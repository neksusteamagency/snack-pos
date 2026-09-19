// src/owner/CategoryManager.jsx
import { useState } from "react";
import { useCategories } from "./useCategories";
import { addCategory, renameCategory, deleteCategory } from "./categoryActions";

export default function CategoryManager({ onClose }) {
  const { categories, loading } = useCategories();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function handleAdd() {
    setError("");
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("That category already exists.");
      return;
    }
    setAdding(true);
    try {
      await addCategory(trimmed);
      setNewName("");
    } catch (err) {
      console.error("Add category failed:", err);
      setError("Could not add category. Try again.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setError("");
  }

  async function handleRename(cat) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setError("Category name can't be empty.");
      return;
    }
    if (trimmed === cat.name) {
      setEditingId(null);
      return;
    }
    setBusyId(cat.id);
    try {
      await renameCategory(cat.id, cat.name, trimmed);
      setEditingId(null);
    } catch (err) {
      console.error("Rename category failed:", err);
      setError("Could not rename category. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    setBusyId(cat.id);
    setError("");
    try {
      await deleteCategory(cat.id, cat.name);
    } catch (err) {
      console.error("Delete category failed:", err);
      setError(err.message || "Could not delete category.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>Manage Categories</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.addRow}>
          <input
            style={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} disabled={adding} style={styles.addBtn}>
            {adding ? "Adding..." : "+ Add"}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {loading ? (
          <p style={styles.emptyText}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p style={styles.emptyText}>No categories yet. Add one above.</p>
        ) : (
          <div style={styles.list}>
            {categories.map((cat) => (
              <div key={cat.id} style={styles.row}>
                {editingId === cat.id ? (
                  <input
                    style={styles.editInput}
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(cat)}
                  />
                ) : (
                  <span style={styles.rowName}>{cat.name}</span>
                )}
                <div style={styles.rowActions}>
                  {editingId === cat.id ? (
                    <>
                      <button
                        onClick={() => handleRename(cat)}
                        disabled={busyId === cat.id}
                        style={styles.smallBtn}
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} style={styles.smallBtnGhost}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cat)} style={styles.smallBtnGhost}>
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={busyId === cat.id}
                        style={styles.deleteBtn}
                      >
                        {busyId === cat.id ? "..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  panel: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    padding: 20,
    width: 380,
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 17, color: "var(--color-ink)" },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: 16,
    cursor: "pointer",
    color: "var(--color-ink-muted)",
    padding: 4,
  },
  addRow: { display: "flex", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
    color: "var(--color-ink)",
  },
  addBtn: {
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    border: "none",
    borderRadius: "var(--radius)",
    background: "var(--color-accent)",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  error: { color: "var(--color-danger)", fontSize: 13, margin: "4px 0 12px" },
  emptyText: { fontSize: 13, color: "var(--color-ink-muted)", textAlign: "center", padding: "16px 0" },
  list: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-bg)",
  },
  rowName: { fontSize: 14, fontWeight: 600, color: "var(--color-ink)" },
  editInput: {
    flex: 1,
    padding: 6,
    fontSize: 14,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    marginRight: 8,
    background: "var(--color-surface)",
    color: "var(--color-ink)",
  },
  rowActions: { display: "flex", gap: 6 },
  smallBtn: {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    borderRadius: "var(--radius)",
    background: "var(--color-accent)",
    color: "#fff",
  },
  smallBtnGhost: {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
  },
  deleteBtn: {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    borderRadius: "var(--radius)",
    background: "var(--color-danger)",
    color: "#fff",
  },
};
