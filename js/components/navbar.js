/**
 * Navbar — sticky glass navigation with brand, links, search trigger,
 * theme toggle, and a mobile hamburger drawer.
 */
import { h, qsa } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { theme } from "../core/theme.js";
import { categories } from "../core/registry.js";
import { navigate, currentPath } from "../core/router.js";

export function initNavbar({ openSearch }) {
  const themeBtn = h("button", { class: "theme-toggle", "aria-label": "Toggle dark mode",
    html: theme.current() === "dark" ? icon("sun") : icon("moon") });
  themeBtn.addEventListener("click", () => {
    const t = theme.toggle();
    themeBtn.innerHTML = t === "dark" ? icon("sun") : icon("moon");
  });

  const links = [
    { label: "Home", path: "/" },
    { label: "All Tools", path: "/tools" },
    ...categories.map((c) => ({ label: c.name, path: `/category/${c.id}` })),
    { label: "Favorites", path: "/favorites" },
  ];

  const navLinks = h("nav", { class: "nav-links", "aria-label": "Primary" },
    ...links.slice(0, 5).map((l) => h("a", { href: `#${l.path}`, dataset: { path: l.path } }, l.label)));

  const searchTrigger = h("button", { class: "nav-search-trigger", "aria-label": "Search tools", onclick: openSearch },
    h("span", { style: { display: "grid", placeItems: "center" }, html: icon("search") }),
    h("span", {}, "Search tools…"),
    h("kbd", {}, "⌘K"));

  const hamburger = h("button", { class: "hamburger", "aria-label": "Menu", "aria-expanded": "false", html: icon("menu") });

  const bar = h("header", { class: "navbar" },
    h("div", { class: "navbar__inner" },
      h("a", { class: "brand", href: "#/", "aria-label": "LifeTools home" },
        h("span", { class: "brand__mark", html: icon("zap") }),
        h("span", {}, "Life", h("span", { class: "gradient-text" }, "Tools"))),
      navLinks,
      h("div", { class: "nav-actions" }, searchTrigger, themeBtn, hamburger)));

  // Mobile drawer
  const drawer = h("nav", { class: "mobile-drawer", "aria-label": "Mobile" },
    ...links.map((l) => h("a", { href: `#${l.path}`, dataset: { path: l.path }, onclick: () => toggleDrawer(false) }, l.label)),
    h("button", { class: "btn btn--soft", style: { marginTop: ".5rem" }, html: `${icon("search")} Search tools`, onclick: () => { toggleDrawer(false); openSearch(); } }));

  function toggleDrawer(force) {
    const open = force ?? !drawer.classList.contains("is-open");
    drawer.classList.toggle("is-open", open);
    hamburger.innerHTML = open ? icon("close") : icon("menu");
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  hamburger.addEventListener("click", () => toggleDrawer());

  document.body.prepend(drawer);
  document.body.prepend(bar);

  // Scroll state
  const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Active link highlighting
  function setActive(path) {
    qsa("[data-path]").forEach((a) => {
      const p = a.dataset.path;
      const active = p === "/" ? path === "/" : path.startsWith(p);
      a.classList.toggle("is-active", active);
    });
  }
  return { setActive };
}
