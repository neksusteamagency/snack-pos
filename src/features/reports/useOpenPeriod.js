// src/features/reports/useOpenPeriod.js
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

// The current open business period is everything since the last End Day close.
// periodStart === null means the shop has never closed a day yet (very first period).
export function useOpenPeriod() {
  const [periodStart, setPeriodStart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "dayCloses"), orderBy("closedAt", "desc"), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPeriodStart(snap.empty ? null : snap.docs[0].data().closedAt);
        setLoading(false);
      },
      (err) => {
        console.error("Open period lookup failed:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { periodStart, loading };
}