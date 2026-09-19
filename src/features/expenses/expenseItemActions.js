// src/expenses/expenseItemActions.js
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function addExpenseItem(name) {
  await addDoc(collection(db, "expenseItems"), { name });
}

export async function deleteExpenseItem(id) {
  await deleteDoc(doc(db, "expenseItems", id));
}
