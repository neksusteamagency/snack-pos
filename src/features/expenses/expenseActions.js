import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function addExpense({ description, amount }) {
  await addDoc(collection(db, "expenses"), {
    description,
    amount,
    createdAt: Date.now(),
  });
}

export async function deleteExpense(id) {
  await deleteDoc(doc(db, "expenses", id));
}