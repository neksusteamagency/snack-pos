import { formatUSD, formatLBP } from "../../lib/currency";

const SHOP_NAME = "سناك عمو وسام"; // <-- change this
const FOOTER_TEXT = "Thank you!";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const CSS = `
  @page { margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Tahoma, sans-serif; color: #000; font-size: 12px; }
  .ticket { width: 72mm; padding: 3mm 2mm; page-break-after: always; break-after: page; }
  .ticket:last-child { page-break-after: auto; break-after: auto; }
  .center { text-align: center; }
  .shop { font-size: 18px; font-weight: 700; }
  .meta { font-size: 11px; margin-top: 2px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; }
  .row .name { flex: 1; }
  .row .amt { text-align: right; white-space: nowrap; }
  .total { font-size: 15px; font-weight: 700; }
  .badge { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
  .order-item { font-size: 18px; font-weight: 700; padding: 3px 0; }
  .footer { margin-top: 8px; font-size: 13px; font-weight: 700; }
`;

function header(title, date, cashier) {
  return `
    <div class="center">
      <div class="shop">${esc(SHOP_NAME)}</div>
      <div class="badge">${esc(title)}</div>
      <div class="meta">${esc(date.toLocaleString())}</div>
      <div class="meta">Cashier: ${esc(cashier)}</div>
    </div>
    <hr/>`;
}

function receiptTicket({ items, total, cashier, date }) {
  const rows = items
    .map(
      (i) => `
      <div class="row">
        <span class="name">${i.qty} x ${esc(i.name)}</span>
        <span class="amt">${esc(formatUSD(i.price * i.qty))}</span>
      </div>`
    )
    .join("");
  return `
    <div class="ticket">
      ${header("RECEIPT", date, cashier)}
      ${rows}
      <hr/>
      <div class="row total"><span>TOTAL</span><span class="amt">${esc(formatUSD(total))}</span></div>
      <div class="row"><span></span><span class="amt">${esc(formatLBP(total))}</span></div>
      <hr/>
      <div class="center footer">${esc(FOOTER_TEXT)}</div>
    </div>`;
}

function orderTicket({ items, cashier, date }) {
  const rows = items
    .map((i) => `<div class="order-item">${i.qty} x ${esc(i.name)}</div>`)
    .join("");
  return `
    <div class="ticket">
      ${header("ORDER", date, cashier)}
      ${rows}
    </div>`;
}

function printHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html}</body></html>`);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  iframe.contentWindow.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error("Print failed:", err);
    }
    setTimeout(() => iframe.isConnected && iframe.remove(), 60000); // safety cleanup
  }, 150);
}

/**
 * Prints the customer receipt and the order ticket (two pages, so the
 * printer cuts between them). Never throws: a printer problem must not
 * block a sale.
 */
export function printTickets({ items, total, cashier }) {
  try {
    const data = { items, total, cashier, date: new Date() };
    printHtml(receiptTicket(data) + orderTicket(data));
  } catch (err) {
    console.error("Print failed:", err);
  }
}
