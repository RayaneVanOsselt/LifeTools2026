/**
 * Navbar — sticky glass navigation with brand, links, search trigger,
 * language switcher, theme toggle, and a mobile hamburger drawer.
 */
import { h, qsa } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { theme } from "../core/theme.js";
import { categories } from "../core/registry.js";
import { navigate } from "../core/router.js";
import { t, availableLocales, getLocale, setLocale, getLocaleData } from "../core/i18n.js";
import { auth } from "../core/auth.js";
import { subscription } from "../core/subscription.js";

export function initNavbar({ openSearch }) {
  const themeBtn = h("button", { class: "theme-toggle", "aria-label": "Toggle dark mode",
    html: theme.current() === "dark" ? icon("sun") : icon("moon") });
  themeBtn.addEventListener("click", () => {
    const th = theme.toggle();
    themeBtn.innerHTML = th === "dark" ? icon("sun") : icon("moon");
  });

  // ---- Language switcher (flag button + dropdown) ----
  const langMenu = h("div", { class: "lang-menu", role: "menu" });
  const langBtn = h("button", { class: "lang-btn", "aria-haspopup": "true", "aria-expanded": "false",
    "aria-label": t("nav.language") });
  const langWrap = h("div", { class: "lang-switch" }, langBtn, langMenu);

  function renderLangMenu() {
    langBtn.innerHTML = `<span class="lang-btn__flag">${getLocaleData().flag}</span><span class="lang-btn__code">${getLocale().toUpperCase()}</span>`;
    langMenu.innerHTML = "";
    for (const l of availableLocales()) {
      const item = h("button", {
        class: `lang-item ${l.code === getLocale() ? "is-active" : ""}`, role: "menuitem",
        onclick: () => { setLocale(l.code); closeLang(); },
      }, h("span", {}, l.flag), h("span", {}, l.name));
      langMenu.append(item);
    }
  }
  function openLang() { langWrap.classList.add("is-open"); langBtn.setAttribute("aria-expanded", "true"); }
  function closeLang() { langWrap.classList.remove("is-open"); langBtn.setAttribute("aria-expanded", "false"); }
  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langWrap.classList.contains("is-open") ? closeLang() : openLang();
  });
  document.addEventListener("click", (e) => { if (!langWrap.contains(e.target)) closeLang(); });

  // ---- Nav links ----
  function linkDefs() {
    return [
      { label: t("nav.home"), path: "/" },
      { label: t("nav.tools"), path: "/tools" },
      ...categories.map((c) => ({ label: t(`cat.${c.id}`), path: `/category/${c.id}` })),
      { label: t("nav.favorites"), path: "/favorites" },
    ];
  }

  const navLinks = h("nav", { class: "nav-links", "aria-label": "Primary" });
  const searchTrigger = h("button", { class: "nav-search-trigger", "aria-label": t("nav.search"), onclick: openSearch });
  const hamburger = h("button", { class: "hamburger", "aria-label": "Menu", "aria-expanded": "false", html: icon("menu") });
  const drawer = h("nav", { class: "mobile-drawer", "aria-label": "Mobile" });
  const accountSlot = h("div", { class: "nav-account" });

  // ---- Account button (reflects auth state) ----
  function renderAccount() {
    accountSlot.innerHTML = "";
    const user = auth.currentUser();
    if (!user) {
      accountSlot.append(h("button", { class: "btn btn--primary btn--sm", onclick: () => window.LifeToolsAuth?.open("login") }, t("auth.signIn")));
    } else {
      const premium = subscription.isPremium(user);
      accountSlot.append(h("button", { class: "account-chip", onclick: () => navigate("/account"), "aria-label": t("auth.myAccount") },
        h("span", { class: `account-avatar ${premium ? "is-premium" : ""}` }, user.name.trim()[0].toUpperCase()),
        h("span", { class: "account-chip__name" }, user.name.split(" ")[0]),
        premium ? h("span", { class: "account-chip__pro" }, "★") : null));
    }
  }

  function renderLinks() {
    const links = linkDefs();
    navLinks.innerHTML = "";
    links.slice(0, 5).forEach((l) => navLinks.append(h("a", { href: `#${l.path}`, dataset: { path: l.path } }, l.label)));

    searchTrigger.innerHTML = "";
    searchTrigger.append(
      h("span", { style: { display: "grid", placeItems: "center" }, html: icon("search") }),
      h("span", {}, t("nav.search")),
      h("kbd", {}, "⌘K"));

    drawer.innerHTML = "";
    const user = auth.currentUser();
    drawer.append(h("a", { href: "#/account", dataset: { path: "/account" }, onclick: () => toggleDrawer(false) },
      user ? `👤 ${t("auth.myAccount")}` : `👤 ${t("auth.signIn")}`));
    links.forEach((l) => drawer.append(h("a", { href: `#${l.path}`, dataset: { path: l.path }, onclick: () => toggleDrawer(false) }, l.label)));
    drawer.append(h("button", { class: "btn btn--soft", style: { marginTop: ".5rem" }, html: `${icon("search")} ${t("nav.search")}`, onclick: () => { toggleDrawer(false); openSearch(); } }));
  }

  const bar = h("header", { class: "navbar" },
    h("div", { class: "navbar__inner" },
      h("a", { class: "brand", href: "#/", "aria-label": "LifeTools home" },
        h("span", { class: "brand__mark", html: icon("zap") }),
        h("span", {}, "Life", h("span", { class: "gradient-text" }, "Tools"))),
      navLinks,
      h("div", { class: "nav-actions" }, searchTrigger, langWrap, accountSlot, themeBtn, hamburger)));

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

  const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 12);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  renderLinks();
  renderLangMenu();
  renderAccount();

  function setActive(path) {
    qsa("[data-path]").forEach((a) => {
      const p = a.dataset.path;
      const active = p === "/" ? path === "/" : path.startsWith(p);
      a.classList.toggle("is-active", active);
    });
  }

  /** Re-localize all navbar text after a language change. */
  function refresh() {
    renderLinks();
    renderLangMenu();
    renderAccount();
    langBtn.setAttribute("aria-label", t("nav.language"));
    searchTrigger.setAttribute("aria-label", t("nav.search"));
  }

  /** Update just the account button after an auth/subscription change. */
  function refreshAccount() { renderAccount(); renderLinks(); }

  return { setActive, refresh, refreshAccount };
}
