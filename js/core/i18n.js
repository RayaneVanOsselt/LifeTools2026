/**
 * i18n engine — locale registry, translation lookup, and reactive switching.
 *
 * Design:
 *  - English (`en`) is the source of truth and the fallback for every key.
 *  - Other locales provide overrides for UI strings (`ui`), per-tool content
 *    (`tools`), and in-widget label phrases (`phrases`). Missing keys fall back
 *    to English, so a partially translated locale still works everywhere.
 *  - Switching locale persists the choice and notifies subscribers, which
 *    re-render the affected UI (navbar, footer, current view).
 */
import { store } from "./store.js";

const locales = {};
let current = "en";
const listeners = new Set();

export function registerLocale(data) {
  locales[data.code] = data;
}

export function availableLocales() {
  return Object.values(locales).map((l) => ({ code: l.code, name: l.name, flag: l.flag }));
}

export function getLocale() { return current; }
export function getLocaleData() { return locales[current]; }
export function intlLocale() { return locales[current]?.intl || current; }

function detect() {
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return locales[nav] ? nav : "en";
}

export function initI18n() {
  const saved = store.get("locale");
  current = saved && locales[saved] ? saved : detect();
  document.documentElement.lang = current;
}

export function setLocale(code) {
  if (!locales[code] || code === current) return;
  current = code;
  store.set("locale", code);
  document.documentElement.lang = code;
  listeners.forEach((cb) => cb(code));
}

export function onLocaleChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function resolve(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function interpolate(str, params) {
  if (!params || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : ""));
}

/** Translate a UI key (e.g. "hero.title"). Falls back to English, then the key. */
export function t(key, params) {
  let val = resolve(locales[current]?.ui, key);
  if (val === undefined) val = resolve(locales.en?.ui, key);
  if (val === undefined) return key;
  return interpolate(val, params);
}

/** Localize a tool field (name/tagline/about/steps/tips/faqs). */
export function tt(tool, field) {
  const ov = locales[current]?.tools?.[tool.id]?.[field];
  return ov !== undefined ? ov : tool[field];
}

/** Translate an in-widget label phrase; unknown phrases pass through (English). */
export function tp(phrase) {
  if (!phrase || current === "en") return phrase;
  const dict = locales[current]?.phrases;
  return (dict && dict[phrase]) || phrase;
}
