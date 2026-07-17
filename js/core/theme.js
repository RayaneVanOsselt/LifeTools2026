/**
 * Theme controller — system detection, manual override, persistence.
 */
import { store } from "./store.js";

const mq = window.matchMedia("(prefers-color-scheme: dark)");

function resolve(pref) {
  if (pref === "system") return mq.matches ? "dark" : "light";
  return pref;
}

function apply(pref) {
  const theme = resolve(pref);
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0a1c17" : "#f2f5f5");
}

export const theme = {
  init() {
    apply(store.get("theme"));
    mq.addEventListener("change", () => {
      if (store.get("theme") === "system") apply("system");
    });
    store.on("theme", apply);
  },
  current() {
    return resolve(store.get("theme"));
  },
  /** Cycle light -> dark (manual). */
  toggle() {
    const next = this.current() === "dark" ? "light" : "dark";
    store.set("theme", next);
    return next;
  },
  set(pref) {
    store.set("theme", pref);
  },
};
