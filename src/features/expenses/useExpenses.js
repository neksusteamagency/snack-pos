import { useEffect, useRef, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useExpenses(startMs, endMs, reloadToken = 0) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasLoadedOnce.current) setLoading(true);
      setError("");
      try {
        const expensesRef = collection(db, "expenses");
        const q =
          startMs != null && endMs != null
            ? query(
                expensesRef,
                where("createdAt", ">=", startMs),
                where("createdAt", "<=", endMs),
                orderBy("createdAt", "desc")
              )
            : query(expensesRef, orderBy("createdAt", "desc"));

        const snap = await getDocs(q);
        if (!cancelled) {
          setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          hasLoadedOnce.current = true;
        }
      } catch (err) {
        console.error("Expenses query failed:", err);
        if (!cancelled) setError("Could not load expenses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [startMs, endMs, reloadToken]);

  return { expenses, loading, error };
}