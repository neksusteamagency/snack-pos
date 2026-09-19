import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function refundSale(saleId) {
  await updateDoc(doc(db, "sales", saleId), {
    refunded: true,
    refundedAt: Date.now(),
  });
}


export async function updateSale(saleId, { items, total }) {
  await updateDoc(doc(db, "sales", saleId), {
    items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    total,
    editedAt: Date.now(),
  });
}