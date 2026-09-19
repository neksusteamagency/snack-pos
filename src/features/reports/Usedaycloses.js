// src/reports/useDayCloses.js
import { useEffect, useRef, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useDayCloses(reloadToken = 0) {
  const [dayCloses, setDayCloses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasLoadedOnce.current) setLoading(true);
      setError("");
      try {
        const ref = collection(db, "dayCloses");
        const q = query(ref, orderBy("closedAt", "desc"));
        const snap = await getDocs(q);
        if (!cancelled) {
          setDayCloses(snap.docs.map((d) => ({ id: d.id, dateKey: d.id, ...d.data() })));
          hasLoadedOnce.current = true;
        }
      } catch (err) {
        console.error("Day-close report query failed:", err);
        if (!cancelled) setError("Could not load end-of-day reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { dayCloses, loading, error };
}