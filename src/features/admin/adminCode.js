import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function verifyAdminCode(code) {
  const staffRef = collection(db, "staff");
  const q = query(staffRef, where("role", "==", "owner"), where("pin", "==", code));
  const snap = await getDocs(q);
  return !snap.empty;
}