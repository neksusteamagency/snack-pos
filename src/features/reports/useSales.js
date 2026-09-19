import { useEffect, useRef, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useSales(startMs, endMs, reloadToken = 0) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasLoadedOnce.current) setLoading(true);
      setError("");
      try {
        const salesRef = collection(db, "sales");
        const q = query(
          salesRef,
          where("createdAt", ">=", startMs),
          where("createdAt", "<=", endMs)
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          hasLoadedOnce.current = true;
        }
      } catch (err) {
        console.error("Sales query failed:", err);
        if (!cancelled) setError("Could not load sales.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startMs, endMs, reloadToken]);

  return { sales, loading, error };
}