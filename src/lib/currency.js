// lib/currency.js
export const USD_TO_LBP_RATE = 90000;

export function usdToLbp(usdAmount) {
  return Math.round((usdAmount ?? 0) * USD_TO_LBP_RATE);
}

export function lbpToUsd(lbpAmount) {
  return (lbpAmount ?? 0) / USD_TO_LBP_RATE;
}

export function formatUSD(usdAmount) {
  return `$${(usdAmount ?? 0).toFixed(2)}`;
}

export function formatLBP(usdAmount) {
  return `${usdToLbp(usdAmount).toLocaleString("en-US")} LBP`;
}

// "$5.00 · 450,000 LBP" — for places that just want one inline string
export function formatDual(usdAmount) {
  return `${formatUSD(usdAmount)} · ${formatLBP(usdAmount)}`;
}