/**
 * Shared UI building blocks — tool cards, reveal-on-scroll observer,
 * animated counters, favorite buttons.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { categoryMap } from "../core/registry.js";
import { isFavorite, toggleFavorite } from "../core/store.js";
import { navigate } from "../core/router.js";
import { toast } from "../components/toast.js";

/** A single tool card for grids. */
export function toolCard(tool) {
  const cat = categoryMap[tool.category];
  const fav = h("button", {
    class: `fav-btn ${isFavorite(tool.id) ? "is-fav" : ""}`,
    "aria-label": "Toggle favorite", html: icon("star"),
    style: { position: "absolute", top: "1rem", right: "1rem" },
  });
  fav.addEventListener("click", (e) => {
    e.stopPropagation();
    const on = toggleFavorite(tool.id);
    fav.classList.toggle("is-fav", on);
    toast(on ? `Added ${tool.name} to favorites` : `Removed from favorites`, "success", 1600);
  });

  const card = h("article", {
    class: "tool-card reveal", "data-reveal": "scale", tabindex: "0", role: "link",
    "aria-label": tool.name,
    style: { "--card-accent": cat.accent },
  },
    fav,
    h("div", { class: "tool-card__icon" }, tool.icon),
    h("h3", { class: "tool-card__title" }, tool.name),
    h("p", { class: "tool-card__desc" }, tool.tagline),
    h("div", { class: "tool-card__foot" },
      h("span", { class: "tool-card__cat" }, cat.name),
      tool.badge ? h("span", { class: "hero-badge__pill" }, tool.badge)
        : h("span", { style: { color: cat.accent }, html: icon("arrowRight") })),
  );

  const go = () => navigate(`/tool/${tool.id}`);
  card.addEventListener("click", go);
  card.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  // pointer glow follow
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
  return card;
}

/** IntersectionObserver that reveals `.reveal` elements as they scroll in. */
let revealObserver;
const supportsIO = typeof IntersectionObserver !== "undefined";
export function observeReveals(root = document) {
  const els = [...root.querySelectorAll(".reveal:not(.is-visible)")];
  if (!els.length) return;

  // Respect reduced-motion or missing IO: reveal immediately, no animation.
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !supportsIO) { els.forEach((el) => el.classList.add("is-visible")); return; }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObserver.unobserve(e.target); }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  }
  els.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 40, 320)}ms`;
    revealObserver.observe(el);
  });

  // Safety net: content must never stay invisible if the observer fails to
  // fire (e.g. detached/zero-size viewport during init). Reveal any leftovers.
  setTimeout(() => {
    for (const el of els) {
      if (!el.classList.contains("is-visible")) {
        el.style.transitionDelay = "0ms";
        el.classList.add("is-visible");
        revealObserver.unobserve(el);
      }
    }
  }, 1500);
}

/** Animate a number from 0 to target when it scrolls into view. */
export function animateCounter(el, target, { duration = 1600, format = (v) => Math.round(v).toLocaleString(), suffix = "" } = {}) {
  const run = () => {
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { run(); io.disconnect(); }
  }, { threshold: 0.5 });
  io.observe(el);
}
