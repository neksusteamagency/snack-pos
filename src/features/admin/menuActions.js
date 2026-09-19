import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function addMenuItem({ name, price, category }) {
  await addDoc(collection(db, "menu"), { name, price, category });
}

export async function updateMenuItem(id, { name, price, category }) {
  await updateDoc(doc(db, "menu", id), { name, price, category });
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, "menu", id));
}