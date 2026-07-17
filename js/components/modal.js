/**
 * Modal — a single reusable overlay with spring animation + focus trap.
 */
import { h, qs } from "../utils/dom.js";
import { icon } from "../utils/icons.js";

let overlay, box, lastFocus;

function ensure() {
  if (overlay) return;
  box = h("div", { class: "modal", role: "dialog", "aria-modal": "true" });
  overlay = h("div", { class: "modal-overlay" }, box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) closeModal();
  });
  document.body.appendChild(overlay);
}

export function openModal({ title, body, actions = [] }) {
  ensure();
  lastFocus = document.activeElement;
  box.innerHTML = "";
  const head = h(
    "div",
    { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" } },
    h("h3", { style: { fontSize: "var(--fs-xl)" } }, title || ""),
    h("button", { class: "btn btn--icon btn--ghost", "aria-label": "Close", html: icon("close"), onclick: closeModal })
  );
  box.append(head);
  if (typeof body === "string") box.append(h("div", { html: body }));
  else if (body) box.append(body);

  if (actions.length) {
    const foot = h("div", { style: { display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" } });
    for (const a of actions) {
      foot.append(h("button", {
        class: `btn ${a.variant || "btn--ghost"}`,
        onclick: () => { const keep = a.onClick?.(); if (!keep) closeModal(); },
      }, a.label));
    }
    box.append(foot);
  }
  overlay.classList.add("is-open");
  box.querySelector("button, input, textarea, [tabindex]")?.focus();
}

export function closeModal() {
  overlay?.classList.remove("is-open");
  lastFocus?.focus?.();
}
