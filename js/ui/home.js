/**
 * Homepage view — hero with search, stats, category filter grid,
 * featured/popular tools, why-choose, testimonials, FAQ, newsletter.
 */
import { h, debounce } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { categories, categoryMap, allTools, featuredTools, toolCount } from "../core/registry.js";
import { store } from "../core/store.js";
import { navigate } from "../core/router.js";
import { toolCard, observeReveals, animateCounter } from "./components.js";
import { searchTools } from "../components/search.js";
import { toast } from "../components/toast.js";

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
  // animate stats
  root.querySelectorAll("[data-count]").forEach((el) =>
    animateCounter(el, +el.dataset.count, { suffix: el.dataset.suffix || "" }));
}

function hero() {
  const suggest = h("div", { class: "hero-suggest" });
  const input = h("input", { type: "text", placeholder: "Search 40+ tools — try “loan”, “bmi”, “convert”…", "aria-label": "Search tools", autocomplete: "off" });

  const runSuggest = debounce(() => {
    const q = input.value.trim();
    if (!q) { suggest.classList.remove("is-open"); return; }
    const found = searchTools(q, 6);
    suggest.innerHTML = "";
    if (!found.length) { suggest.classList.remove("is-open"); return; }
    found.forEach((t) => {
      const cat = categoryMap[t.category];
      const item = h("div", { class: "search-item", style: { "--card-accent": cat.accent } },
        h("span", { class: "search-item__icon" }, t.icon),
        h("div", { class: "search-item__body" },
          h("div", { class: "search-item__title" }, t.name),
          h("div", { class: "search-item__sub" }, t.tagline)));
      item.addEventListener("click", () => navigate(`/tool/${t.id}`));
      suggest.append(item);
    });
    suggest.classList.add("is-open");
  }, 120);
  input.addEventListener("input", runSuggest);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const f = searchTools(input.value.trim(), 1)[0]; if (f) navigate(`/tool/${f.id}`); }
  });
  document.addEventListener("click", (e) => { if (!suggest.contains(e.target) && e.target !== input) suggest.classList.remove("is-open"); });

  const quick = ["Loan Calculator", "BMI", "Password", "Currency", "QR Code"];
  const marquee = h("div", { class: "marquee" });
  const chips = allTools().slice(0, 14);
  [...chips, ...chips].forEach((t) => {
    const c = h("span", { class: "chip", onclick: () => navigate(`/tool/${t.id}`) }, `${t.icon} ${t.name}`);
    marquee.append(c);
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
          h("span", { class: "hero-badge__pill" }, "New"),
          h("span", {}, "AI assistant now built in — ", h("b", {}, "ask anything"))),
        h("h1", { class: "reveal" }, "Everything you need,", h("br"), h("span", { class: "gradient-text" }, "in one place.")),
        h("p", { class: "hero__sub reveal" }, "Smart, beautiful online tools that simplify your everyday life — finance, health, productivity, design and conversions. Free, private, and lightning fast."),
        h("div", { class: "hero-search reveal" },
          h("div", { class: "hero-search__box" },
            h("span", { style: { color: "var(--text-mute)", display: "grid", placeItems: "center" }, html: icon("search") }),
            input,
            h("button", { class: "btn btn--primary", onclick: () => { const f = searchTools(input.value.trim(), 1)[0]; navigate(f ? `/tool/${f.id}` : "/tools"); } }, "Search")),
          suggest,
          h("div", { class: "hero-search__hint" }, "Popular:",
            ...quick.map((q) => h("button", { onclick: () => { const f = searchTools(q, 1)[0]; if (f) navigate(`/tool/${f.id}`); } }, q)))),
        h("div", { class: "hero__cta reveal" },
          h("button", { class: "btn btn--primary btn--lg", onclick: () => navigate("/tools") }, "Explore all tools ", h("span", { html: icon("arrowRight") })),
          h("button", { class: "btn btn--ghost btn--lg", onclick: () => window.LifeToolsAssistant?.open() }, h("span", { html: icon("sparkle") }), " Ask the AI")),
        heroStats())),
    h("div", { class: "container marquee-wrap" }, marquee));
}

function heroStats() {
  const stats = [
    { count: toolCount(), suffix: "+", label: "Free tools" },
    { count: 5, label: "Categories" },
    { count: 100, suffix: "%", label: "Private & free" },
    { count: 12000, suffix: "+", label: "Monthly users" },
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
    { id: "featured", name: "⭐ Popular" },
    ...categories.map((c) => ({ id: c.id, name: `${c.icon} ${c.name}` })),
    { id: "all", name: "All" },
  ];

  function paint() {
    let list;
    if (active === "featured") list = featuredTools();
    else if (active === "all") list = allTools();
    else list = allTools().filter((t) => t.category === active);
    grid.innerHTML = "";
    list.forEach((t) => grid.append(toolCard(t)));
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
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), "The toolbox"),
      h("h2", { class: "section__title" }, "Pick a tool, get an instant answer"),
      h("p", { class: "section__lead" }, "Every tool is designed to be fast, accurate and delightful to use — no sign-up required.")),
    bar, grid,
    h("div", { style: { textAlign: "center", marginTop: "2rem" } },
      h("button", { class: "btn btn--ghost btn--lg", onclick: () => navigate("/tools") }, "View all ", h("span", { html: icon("arrowRight") }))));
  paint();
  return section;
}

function whySection() {
  const feats = [
    { icon: "zap", title: "Lightning fast", text: "No bloat, no trackers slowing you down. Tools load instantly and calculate in real time as you type." },
    { icon: "shield", title: "Private by design", text: "Everything runs in your browser. Your numbers, text and data never leave your device." },
    { icon: "sparkle", title: "AI assistant", text: "Not sure which tool you need? Ask our built-in assistant and get pointed to the right one instantly." },
    { icon: "heart", title: "Free forever", text: "The whole toolbox is free — no paywalls, no credit card, no catch. Just useful tools." },
    { icon: "grid", title: "One home for everything", text: "Stop bookmarking a dozen sites. Finance, health, dev and conversion tools all live here." },
    { icon: "star", title: "Save your favorites", text: "Star the tools you use most and pick up right where you left off, every time." },
  ];
  return h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), "Why LifeTools"),
      h("h2", { class: "section__title" }, "Built like a product, not a page"),
      h("p", { class: "section__lead" }, "The polish of a premium app, the simplicity of a single search box.")),
    h("div", { class: "feature-grid" },
      ...feats.map((f) => h("div", { class: "feature reveal" },
        h("div", { class: "feature__icon", html: icon(f.icon) }),
        h("h3", {}, f.title),
        h("p", {}, f.text)))));
}

function testimonialsSection() {
  const items = [
    { name: "Sara Lindqvist", role: "Freelance designer", color: "#345ef4", stars: 5, quote: "I used to have five bookmarks for random calculators. Now it's just LifeTools. The gradient and shadow generators are genuinely part of my workflow." },
    { name: "Marc Dubois", role: "Small business owner", color: "#f43f5e", stars: 5, quote: "The VAT and loan calculators are exactly what I need for quick client quotes. Clean, fast, and the results just make sense." },
    { name: "Priya Nair", role: "Student", color: "#10b981", stars: 5, quote: "The Pomodoro timer and BMI calculator get daily use. It feels like an app I'd pay for, but it's free." },
  ];
  return h("section", { class: "section container" },
    h("div", { class: "section__head section__head--center reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), "Loved by users"),
      h("h2", { class: "section__title" }, "People get things done faster")),
    h("div", { class: "testi-grid" },
      ...items.map((t) => h("div", { class: "testi reveal" },
        h("div", { class: "testi__stars" }, "★".repeat(t.stars)),
        h("p", { class: "testi__quote" }, `“${t.quote}”`),
        h("div", { class: "testi__who" },
          h("div", { class: "testi__avatar", style: { background: t.color } }, t.name[0]),
          h("div", {},
            h("div", { class: "testi__name" }, t.name),
            h("div", { class: "testi__role" }, t.role)))))));
}

function faqSection() {
  const faqs = [
    { q: "Is LifeTools really free?", a: "Yes. Every tool is free to use with no account required. We may add optional premium features in the future, but the core toolbox stays free." },
    { q: "Do you store my data?", a: "No. All calculations happen locally in your browser. Favorites and history are saved only on your device using local storage." },
    { q: "Do I need to install anything?", a: "Nothing at all. LifeTools runs in any modern browser on desktop and mobile. Add it to your home screen for one-tap access." },
    { q: "How accurate are the calculators?", a: "The math uses standard, well-established formulas. Financial tools are estimates — always confirm important figures with a professional." },
    { q: "Can I suggest a new tool?", a: "Absolutely. The platform is built to grow — new tools are added regularly based on what people ask for." },
  ];
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
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), "FAQ"),
      h("h2", { class: "section__title" }, "Questions, answered")),
    list);
}

function newsletterSection() {
  const email = h("input", { type: "email", placeholder: "you@example.com", "aria-label": "Email address", required: true });
  const form = h("form", { class: "newsletter-form" },
    email,
    h("button", { class: "btn", style: { background: "#fff", color: "var(--brand-700)" }, type: "submit" }, "Subscribe"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!email.value.includes("@")) { toast("Please enter a valid email", "error"); return; }
    store.update("settings", (s) => ({ ...s, newsletter: true }));
    toast("Subscribed! Welcome aboard 🎉", "success");
    email.value = "";
  });
  return h("section", { class: "section container" },
    h("div", { class: "cta-band reveal" },
      h("h2", {}, "Get new tools in your inbox"),
      h("p", {}, "One short email when we ship something useful. No spam, ever."),
      form));
}
