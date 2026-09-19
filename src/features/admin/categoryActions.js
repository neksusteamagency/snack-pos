// src/owner/categoryActions.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function addCategory(name) {
  await addDoc(collection(db, "categories"), { name });
}

// Menu items store the category as a plain name string (not a reference),
// so renaming has to cascade to every menu item using the old name.
export async function renameCategory(id, oldName, newName) {
  const batch = writeBatch(db);
  batch.update(doc(db, "categories", id), { name: newName });

  const menuQ = query(collection(db, "menu"), where("category", "==", oldName));
  const menuSnap = await getDocs(menuQ);
  menuSnap.docs.forEach((d) => batch.update(d.ref, { category: newName }));

  await batch.commit();
}

export async function deleteCategory(id, name) {
  const menuQ = query(collection(db, "menu"), where("category", "==", name));
  const menuSnap = await getDocs(menuQ);
  if (!menuSnap.empty) {
    throw new Error(
      `"${name}" is used by ${menuSnap.size} menu item${menuSnap.size === 1 ? "" : "s"}. Move or delete those items first.`
    );
  }
  await deleteDoc(doc(db, "categories", id));
}
