import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import PinPad from "./features/auth/PinPad";
import CashierView from "./features/cashier/CashierView";
import OwnerView from "./features/admin/OwnerView";
import { useOnlineStatus } from "./features/shared/useOnlineStatus";

function Gate() {
  const { session, logout } = useAuth();
  const online = useOnlineStatus();
  if (!session) return <PinPad />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {!online && <div style={styles.offlineBanner}>Offline — sales will sync when back online</div>}
      <div style={styles.header}>
        <div>
          <div style={styles.brand}>NeksusTeam Systems</div>
          <h1 style={styles.role}>
            {session.role === "owner" ? "Owner" : "Cashier"} — {session.name}
          </h1>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          Log out
        </button>
      </div>
      <div style={{ padding: "0 24px 24px" }}>{session.role === "owner" ? <OwnerView /> : <CashierView />}</div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;

const styles = {
  offlineBanner: {
    background: "#b45309",
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    background: "var(--color-ink)",
    borderBottom: "1px solid var(--color-border)",
  },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
  },
  role: { fontSize: 18, fontWeight: 700, margin: "2px 0 0", color: "#fff" },
  logoutBtn: {
    padding: "9px 16px",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "var(--radius)",
    background: "transparent",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
  },
};