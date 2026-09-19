import { useState } from "react";
import { useAuth } from "./AuthContext";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export default function PinPad() {
  const { loginWithPin, error, firebaseReady } = useAuth();
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function press(key) {
    if (submitting) return;
    if (key === "clear") { setPin(""); return; }
    if (key === "back") { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) submit(next);
  }

  async function submit(value) {
    setSubmitting(true);
    const ok = await loginWithPin(value);
    setSubmitting(false);
    if (!ok) setPin("");
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>NeksusTeam POS</div>
        <h1 style={styles.title}>Enter your PIN</h1>

        <div style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ ...styles.dot, background: i < pin.length ? "var(--color-accent)" : "var(--color-border)" }} />
          ))}
        </div>

        <p style={styles.status}>{!firebaseReady ? "Connecting..." : error || " "}</p>

        <div style={styles.grid}>
          {KEYS.map((key) => (
            <button key={key} onClick={() => press(key)} disabled={submitting} style={key === "clear" || key === "back" ? styles.utilKey : styles.key}>
              {key === "clear" ? "C" : key === "back" ? "⌫" : key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" },
  card: { background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "36px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  brand: { fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "var(--color-ink-muted)" },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "var(--color-ink)" },
  dots: { display: "flex", gap: 12, margin: "6px 0" },
  dot: { width: 12, height: 12, borderRadius: "50%" },
  status: { color: "var(--color-danger)", fontSize: 13, minHeight: 18, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 76px)", gap: 10 },
  key: { width: 76, height: 76, fontSize: 22, fontWeight: 600, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-ink)" },
  utilKey: { width: 76, height: 76, fontSize: 18, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-ink-muted)" },
};