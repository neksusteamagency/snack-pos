// src/reports/periodRanges.js

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekRange(refDate = new Date()) {
  const d = startOfDay(refDate);
  const day = d.getDay(); // Sunday-start, matching the existing "This Week" preset
  d.setDate(d.getDate() - day);
  const start = d.getTime();
  const endD = new Date(start);
  endD.setDate(endD.getDate() + 7);
  return { start, end: endD.getTime() - 1 };
}

export function getMonthRange(refDate = new Date()) {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1).getTime();
  const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1).getTime() - 1;
  return { start, end };
}

export function getQuarterRange(refDate = new Date()) {
  const q = Math.floor(refDate.getMonth() / 3);
  const start = new Date(refDate.getFullYear(), q * 3, 1).getTime();
  const end = new Date(refDate.getFullYear(), q * 3 + 3, 1).getTime() - 1;
  return { start, end };
}

export function getHalfYearRange(refDate = new Date()) {
  const h = refDate.getMonth() < 6 ? 0 : 1;
  const start = new Date(refDate.getFullYear(), h * 6, 1).getTime();
  const end = new Date(refDate.getFullYear(), h * 6 + 6, 1).getTime() - 1;
  return { start, end };
}

export function getYearRange(refDate = new Date()) {
  const start = new Date(refDate.getFullYear(), 0, 1).getTime();
  const end = new Date(refDate.getFullYear() + 1, 0, 1).getTime() - 1;
  return { start, end };
}

const RANGE_GETTERS = {
  week: getWeekRange,
  month: getMonthRange,
  quarter: getQuarterRange,
  half: getHalfYearRange,
  year: getYearRange,
};

// Move a range forward/backward by `amount` periods of `unit`.
// amount is typically -1 (prev) or 1 (next).
export function shiftRange(range, unit, amount) {
  const d = new Date(range.start);
  switch (unit) {
    case "week":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + amount);
      break;
    case "quarter":
      d.setMonth(d.getMonth() + amount * 3);
      break;
    case "half":
      d.setMonth(d.getMonth() + amount * 6);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + amount);
      break;
    default:
      return range;
  }
  return RANGE_GETTERS[unit](d);
}

export function formatRangeLabel(range, unit) {
  const startD = new Date(range.start);
  const endD = new Date(range.end);
  const dateOpts = { month: "short", day: "numeric", year: "numeric" };

  if (unit === "month") return startD.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  if (unit === "quarter") return `Q${Math.floor(startD.getMonth() / 3) + 1} ${startD.getFullYear()}`;
  if (unit === "half") return `${startD.getMonth() < 6 ? "H1" : "H2"} ${startD.getFullYear()}`;
  if (unit === "year") return `${startD.getFullYear()}`;
  return `${startD.toLocaleDateString(undefined, dateOpts)} – ${endD.toLocaleDateString(undefined, dateOpts)}`;
}
