// src/features/cashier/RefundsView.jsx
import { useState } from "react";
import { useSales } from "../reports/useSales";
import SalesLog from "../reports/SalesLog";
import EditSaleModal from "../reports/EditSaleModal";
import { useOpenPeriod } from "../reports/useOpenPeriod";

export default function RefundsView({ onClose }) {
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedSale, setSelectedSale] = useState(null);

  const { periodStart, loading: periodLoading } = useOpenPeriod();
  const { sales, loading, error } = useSales(periodStart ?? 0, Date.now(), reloadToken);

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span>Today's Orders</span>
          <button onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
        <div style={styles.body}>
          {periodLoading || loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: "var(--color-danger)" }}>{error}</p>
          ) : (
            <SalesLog
              sales={sales}
              onRefunded={() => setReloadToken((t) => t + 1)}
              onSelect={setSelectedSale}
            />
          )}
        </div>
      </div>

      {selectedSale && (
        <EditSaleModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onSaved={() => {
            setSelectedSale(null);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
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
  panel: {
    background: "var(--color-bg)",
    borderRadius: "var(--radius)",
    width: 560,
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
  body: { padding: 16, overflowY: "auto" },
};