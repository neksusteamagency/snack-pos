import { addDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";

export async function checkoutSale({ items, total, cashier }) {
  const saleRef = collection(db, "sales");
  await addDoc(saleRef, {
    items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    total,
    cashier,
    createdAt: Date.now(), // plain client timestamp — single register, works fine offline
  });
}