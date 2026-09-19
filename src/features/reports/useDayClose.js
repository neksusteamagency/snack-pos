import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dateKeyFor(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useDayClose(dateKey) {
  const [closeInfo, setCloseInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // dayCloses documents now have auto-generated IDs (a day can have more
    // than one close), so look up the most recent close for this dateKey
    // via a query instead of reading a doc keyed by dateKey directly.
    // Note: this requires a composite index on (dateKey asc, closedAt desc) —
    // Firestore will show a console link to create it the first time this runs.
    const q = query(
      collection(db, "dayCloses"),
      where("dateKey", "==", dateKey),
      orderBy("closedAt", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      setCloseInfo(snap.empty ? null : snap.docs[0].data());
      setLoading(false);
    });
    return () => unsub();
  }, [dateKey]);

  return { closeInfo, loading };
}