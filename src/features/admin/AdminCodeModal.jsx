import { useState } from "react";
import { verifyAdminCode } from "./adminCode";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export default function AdminCodeModal({ onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  function press(key) {
    if (checking) return;
    if (key === "clear") {
      setCode("");
      return;
    }
    if (key === "back") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (code.length >= 6) return;
    const next = code + key;
    setCode(next);
    if (next.length === 4) submit(next);
  }

  async function submit(value) {
    setChecking(true);
    setError("");
    try {
      const ok = await verifyAdminCode(value);
      if (ok) {
        onSuccess();
      } else {
        setError("Incorrect code.");
        setCode("");
      }
    } catch (err) {
      console.error("Admin code check failed:", err);
      setError("Could not verify code. Try again.");
      setCode("");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.brand}>Admin Access</div>
        <h1 style={styles.title}>Enter admin code</h1>

        <div style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ ...styles.dot, background: i < code.length ? "var(--color-accent)" : "var(--color-border)" }}
            />
          ))}
        </div>

        <p style={styles.status}>{error || " "}</p>

        <div style={styles.grid}>
          {KEYS.map((key) => (
            <button
              key={key}
              onClick={() => press(key)}
              disabled={checking}
              style={key === "clear" || key === "back" ? styles.utilKey : styles.key}
            >
              {key === "clear" ? "C" : key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>

        <button onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,20,30,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  card: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 12,
    padding: "36px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
  },
  brand: { fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "var(--color-ink-muted)" },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-ink)" },
  dots: { display: "flex", gap: 12, margin: "6px 0" },
  dot: { width: 12, height: 12, borderRadius: "50%" },
  status: { color: "var(--color-danger)", fontSize: 13, minHeight: 18, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 76px)", gap: 10 },
  key: {
    width: 76,
    height: 76,
    fontSize: 22,
    fontWeight: 600,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-ink)",
  },
  utilKey: {
    width: 76,
    height: 76,
    fontSize: 18,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-ink-muted)",
  },
  cancelBtn: {
    marginTop: 8,
    padding: "10px 20px",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-bg)",
    color: "var(--color-ink-muted)",
    fontWeight: 600,
    fontSize: 14,
  },
};