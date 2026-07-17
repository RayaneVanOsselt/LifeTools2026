/**
 * Toast notifications — transient, stacked, auto-dismissing.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";

let stack;

function ensureStack() {
  if (!stack) {
    stack = h("div", { class: "toast-stack", "aria-live": "polite", "aria-atomic": "true" });
    document.body.appendChild(stack);
  }
  return stack;
}

const ICON = { success: "check", error: "close", info: "info" };

export function toast(message, type = "success", duration = 3200) {
  const el = h(
    "div",
    { class: `toast toast--${type}`, role: "status" },
    h("span", { class: "toast__icon", html: icon(ICON[type] || "info") }),
    h("span", { class: "toast__msg" }, message)
  );
  ensureStack().appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-in"));
  const remove = () => {
    el.classList.remove("is-in");
    setTimeout(() => el.remove(), 320);
  };
  const timer = setTimeout(remove, duration);
  el.addEventListener("click", () => { clearTimeout(timer); remove(); });
  return remove;
}
