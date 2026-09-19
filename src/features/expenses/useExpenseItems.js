// src/expenses/useExpenseItems.js
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

export function useExpenseItems() {
  const [expenseItems, setExpenseItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "expenseItems"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setExpenseItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { expenseItems, loading };
}
