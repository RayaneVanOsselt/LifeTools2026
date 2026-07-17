/**
 * Homepage view — hero with search, stats, category filter grid,
 * featured/popular tools, why-choose, testimonials, FAQ, newsletter.
 */
import { h, debounce } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { categories, categoryMap, allTools, featuredTools, toolCount, getTool } from "../core/registry.js";
import { store } from "../core/store.js";
import { navigate } from "../core/router.js";
import { toolCard, observeReveals, animateCounter } from "./components.js";
import { searchTools } from "../components/search.js";
import { toast } from "../components/toast.js";
import { t, tt } from "../core/i18n.js";

export function renderHome(root) {
  root.innerHTML = "";
  root.append(
    hero(),
    toolsSection(),
    whySection(),
    testimonialsSection(),
    faqSection(),
    newsletterSection(),
  );
  observeReveals(root);
  root.querySelectorAll("[data-count]").forEach((el) =>
    animateCounter(el, +el.dataset.count, { suffix: el.dataset.suffix || "" }));
}

function hero() {
  const suggest = h("div", { class: "hero-suggest" });
  const input = h("input", { type: "text", placeholder: t("hero.searchPlaceholder", { count: toolCount() }), "aria-label": t("nav.search"), autocomplete: "off" });

  const runSuggest = debounce(() => {
    const q = input.value.trim();
    if (!q) { suggest.classList.remove("is-open"); return; }
    const found = searchTools(q, 6);
    suggest.innerHTML = "";
    if (!found.length) { suggest.classList.remove("is-open"); return; }
    found.forEach((tool) => {
      const cat = categoryMap[tool.category];
      const item = h("div", { class: "search-item", style: { "--card-accent": cat.accent } },
        h("span", { class: "search-item__icon" }, tool.icon),
        h("div", { class: "search-item__body" },
          h("div", { class: "search-item__title" }, tt(tool, "name")),
          h("div", { class: "search-item__sub" }, tt(tool, "tagline"))));
      item.addEventListener("click", () => navigate(`/tool/${tool.id}`));
      suggest.append(item);
    });
    suggest.classList.add("is-open");
  }, 120);
  input.addEventListener("input", runSuggest);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const f = searchTools(input.value.trim(), 1)[0]; if (f) navigate(`/tool/${f.id}`); }
  });
  document.addEventListener("click", (e) => { if (!suggest.contains(e.target) && e.target !== input) suggest.classList.remove("is-open"); });

  // Popular quick links reference real tools so they stay localized.
  const quickIds = ["loan", "bmi", "password", "currency", "qr-code"];
  const marquee = h("div", { class: "marquee" });
  const chips = allTools().slice(0, 14);
  [...chips, ...chips].forEach((tool) => {
    marquee.append(h("span", { class: "chip", onclick: () => navigate(`/tool/${tool.id}`) }, `${tool.icon} ${tt(tool, "name")}`));
  });

  return h("section", { class: "hero" },
    h("div", { class: "hero__bg" },
      h("div", { class: "hero__glow hero__glow--1" }),
      h("div", { class: "hero__glow hero__glow--2" }),
      h("div", { class: "hero__glow hero__glow--3" })),
    h("div", { class: "hero__grid-bg" }),
    h("div", { class: "container" },
      h("div", { class: "hero__inner" },
        h("div", { class: "hero-badge reveal" },
          h("span", { class: "hero-badge__pill" }, t("hero.badgeNew")),
          h("span", {}, t("hero.badgePre"), h("b", {}, t("hero.badgeStrong")))),
        h("h1", { class: "reveal" }, t("hero.titleA"), h("br"), h("span", { class: "gradient-text" }, t("hero.titleB"))),
        h("p", { class: "hero__sub reveal" }, t("hero.sub")),
        h("div", { class: "hero-search reveal" },
          h("div", { class: "hero-search__box" },
            h("span", { style: { color: "var(--text-mute)", display: "grid", placeItems: "center" }, html: icon("search") }),
            input,
            h("button", { class: "btn btn--primary", onclick: () => { const f = searchTools(input.value.trim(), 1)[0]; navigate(f ? `/tool/${f.id}` : "/tools"); } }, t("hero.search"))),
          suggest,
          h("div", { class: "hero-search__hint" }, t("hero.popular"),
            ...quickIds.map((id) => { const tool = getTool(id); return tool && h("button", { onclick: () => navigate(`/tool/${id}`) }, tt(tool, "name")); }))),
        h("div", { class: "hero__cta reveal" },
          h("button", { class: "btn btn--primary btn--lg", onclick: () => navigate("/tools") }, t("hero.explore"), " ", h("span", { html: icon("arrowRight") })),
          h("button", { class: "btn btn--ghost btn--lg", onclick: () => window.LifeToolsAssistant?.open() }, h("span", { html: icon("sparkle") }), " " + t("hero.askAI"))),
        heroStats())),
    h("div", { class: "container marquee-wrap" }, marquee));
}

function heroStats() {
  const stats = [
    { count: toolCount(), suffix: "+", label: t("stats.tools") },
    { count: 5, label: t("stats.categories") },
    { count: 100, suffix: "%", label: t("stats.private") },
    { count: 12000, suffix: "+", label: t("stats.users") },
  ];
  return h("div", { class: "hero-stats reveal" },
    ...stats.map((s) => h("div", { class: "stat" },
      h("div", { class: "stat__num gradient-text", dataset: { count: s.count, suffix: s.suffix || "" } }, "0"),
      h("div", { class: "stat__label" }, s.label))));
}

function toolsSection() {
  const grid = h("div", { class: "tool-grid" });
  const bar = h("div", { class: "filter-bar" });
  let active = "featured";

  const filters = [
    { id: "featured", name: t("toolsSec.popular") },
    ...categories.map((c) => ({ id: c.id, name: `${c.icon} ${t(`cat.${c.id}`)}` })),
    { id: "all", name: t("toolsSec.all") },
  ];

  function paint() {
    let list;
    if (active === "featured") list = featuredTools();
    else if (active === "all") list = allTools();
    else list = allTools().filter((tool) => tool.category === active);
    grid.innerHTML = "";
    list.forEach((tool) => grid.append(toolCard(tool)));
    observeReveals(grid);
  }
  for (const f of filters) {
    const chip = h("button", { class: `chip ${f.id === active ? "is-active" : ""}`, onclick: () => {
      active = f.id;
      [...bar.children].forEach((c) => c.classList.toggle("is-active", c === chip));
      paint();
    } }, f.name);
    bar.append(chip);
  }

  const section = h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), t("toolsSec.eyebrow")),
      h("h2", { class: "section__title" }, t("toolsSec.title")),
      h("p", { class: "section__lead" }, t("toolsSec.lead"))),
    bar, grid,
    h("div", { style: { textAlign: "center", marginTop: "2rem" } },
      h("button", { class: "btn btn--ghost btn--lg", onclick: () => navigate("/tools") }, t("toolsSec.viewAll"), " ", h("span", { html: icon("arrowRight") }))));
  paint();
  return section;
}

function whySection() {
  const icons = ["zap", "shield", "sparkle", "heart", "grid", "star"];
  const feats = t("why.items");
  return h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), t("why.eyebrow")),
      h("h2", { class: "section__title" }, t("why.title")),
      h("p", { class: "section__lead" }, t("why.lead"))),
    h("div", { class: "feature-grid" },
      ...feats.map((f, i) => h("div", { class: "feature reveal" },
        h("div", { class: "feature__icon", html: icon(icons[i] || "grid") }),
        h("h3", {}, f.t),
        h("p", {}, f.d)))));
}

function testimonialsSection() {
  const people = [
    { name: "Sara Lindqvist", color: "#0a92b9" },
    { name: "Marc Dubois", color: "#c18440" },
    { name: "Priya Nair", color: "#7d8118" },
  ];
  const items = t("testi.items");
  return h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), t("testi.eyebrow")),
      h("h2", { class: "section__title" }, t("testi.title"))),
    h("div", { class: "testi-grid" },
      ...items.map((it, i) => h("div", { class: "testi reveal" },
        h("div", { class: "testi__stars" }, "★★★★★"),
        h("p", { class: "testi__quote" }, `“${it.quote}”`),
        h("div", { class: "testi__who" },
          h("div", { class: "testi__avatar", style: { background: people[i].color } }, people[i].name[0]),
          h("div", {},
            h("div", { class: "testi__name" }, people[i].name),
            h("div", { class: "testi__role" }, it.role)))))));
}

function faqSection() {
  const faqs = t("faq.items");
  const list = h("div", { class: "faq-list" });
  for (const f of faqs) {
    const a = h("div", { class: "faq-a" }, h("div", { class: "faq-a__inner" }, f.a));
    const item = h("div", { class: "faq-item reveal" },
      h("button", { class: "faq-q", onclick: () => {
        const open = item.classList.toggle("is-open");
        a.style.maxHeight = open ? a.firstChild.scrollHeight + 40 + "px" : "0";
      } }, h("span", {}, f.q), h("span", { html: icon("plus") })),
      a);
    list.append(item);
  }
  return h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), t("faq.eyebrow")),
      h("h2", { class: "section__title" }, t("faq.title"))),
    list);
}

function newsletterSection() {
  const email = h("input", { type: "email", placeholder: t("news.placeholder"), "aria-label": t("news.placeholder"), required: true });
  const form = h("form", { class: "newsletter-form" },
    email,
    h("button", { class: "btn", style: { background: "#fff", color: "var(--brand-700)" }, type: "submit" }, t("news.subscribe")));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!email.value.includes("@")) { toast(t("news.invalid"), "error"); return; }
    store.update("settings", (s) => ({ ...s, newsletter: true }));
    toast(t("news.done"), "success");
    email.value = "";
  });
  return h("section", { class: "section container" },
    h("div", { class: "cta-band reveal" },
      h("h2", {}, t("news.title")),
      h("p", {}, t("news.sub")),
      form));
}
