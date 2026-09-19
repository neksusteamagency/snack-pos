import { useState } from "react";
import MenuManager from "./MenuManager";
import ReportsView from "../reports/ReportsView";
import ExpensesView from "../expenses/ExpensesView";

const TABS = [
  { key: "menu", label: "Menu" },
  { key: "reports", label: "Reports" },
  { key: "expenses", label: "Expenses" },
];

export default function OwnerView() {
  const [tab, setTab] = useState("menu");

  return (
    <div>
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "menu" && <MenuManager />}
      {tab === "reports" && <ReportsView />}
      {tab === "expenses" && <ExpensesView />}
    </div>
  );
}

const styles = {
  tabs: { display: "flex", gap: 4, marginTop: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: 4, width: "fit-content" },
  tab: { padding: "8px 18px", border: "none", background: "none", borderRadius: 7, fontSize: 14, fontWeight: 600, color: "var(--color-ink-muted)" },
  tabActive: { background: "var(--color-accent)", color: "#fff" },
};