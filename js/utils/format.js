/**
 * Formatting helpers — currency, numbers, dates, durations.
 * Number/currency/date formatting follows the active i18n locale.
 */
import { intlLocale } from "../core/i18n.js";

let CURRENCY = "EUR";
const L = () => intlLocale();

export function setCurrency(code) { CURRENCY = code; }
export function getCurrency() { return CURRENCY; }

export function money(n, currency = CURRENCY, opts = {}) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(L(), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    ...opts,
  }).format(n);
}

export function num(n, opts = {}) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(L(), { maximumFractionDigits: 2, ...opts }).format(n);
}

export function percent(n, digits = 1) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(L(), {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n / 100);
}

export function compact(n) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(L(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Human readable duration from minutes. */
export function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Format byte size. */
export function bytes(n) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${num(n, { maximumFractionDigits: 2 })} ${units[i]}`;
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
];
