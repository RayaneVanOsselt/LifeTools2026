/**
 * Views — tool page, all-tools listing, category page, favorites, 404.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import {
  getTool, categoryMap, categories, allTools, toolsByCategory, relatedTools,
} from "../core/registry.js";
import { isFavorite, toggleFavorite, pushRecent, store } from "../core/store.js";
import { navigate } from "../core/router.js";
import { toolCard, observeReveals } from "./components.js";
import { toast } from "../components/toast.js";
import { setSEO } from "../core/seo.js";
import { t, tt } from "../core/i18n.js";
import { accessLevel, ACCESS } from "../core/access.js";
import { premiumGate } from "./premium.js";

const catName = (id) => t(`cat.${id}`);

/* ---------------- Tool page ---------------- */
export function renderTool(root, id) {
  const tool = getTool(id);
  if (!tool) return renderNotFound(root);
  pushRecent(id);
  const cat = categoryMap[tool.category];
  const name = tt(tool, "name");
  setSEO({
    title: `${name} — LifeTools`,
    description: tt(tool, "about") || tt(tool, "tagline"),
    faqs: tt(tool, "faqs"),
    name,
  });

  root.innerHTML = "";
  const favBtn = h("button", { class: `btn btn--ghost ${isFavorite(id) ? "is-fav" : ""}`,
    html: `${icon("star")} <span>${isFavorite(id) ? t("toolPage.saved") : t("toolPage.save")}</span>` });
  favBtn.addEventListener("click", () => {
    const on = toggleFavorite(id);
    favBtn.innerHTML = `${icon("star")} <span>${on ? t("toolPage.saved") : t("toolPage.save")}</span>`;
    favBtn.querySelector("svg").style.fill = on ? "var(--amber-500)" : "none";
    toast(on ? t("toolPage.savedToast") : t("toolPage.removedToast"), "success", 1500);
  });
  if (isFavorite(id)) favBtn.querySelector("svg").style.fill = "var(--amber-500)";

  const askBtn = h("button", { class: "btn btn--soft", html: `${icon("sparkle")} ${t("toolPage.askAI")}`,
    onclick: () => window.LifeToolsAssistant?.askAbout(name) });

  // Access control (level 2/3): a locked premium tool shows the paywall and its
  // mount() is never called, so the tool logic never runs for non-premium users.
  const locked = accessLevel(tool) === ACCESS.PREMIUM;
  const toolRoot = h("div");
  const panel = locked
    ? premiumGate(tool)
    : h("div", { class: "tool-panel" }, toolRoot);

  const page = h("div", { class: "tool-page view", style: { "--card-accent": cat.accent } },
    h("div", { class: "container" },
      breadcrumb(cat, name),
      h("div", { class: "tool-header" },
        h("div", { class: "tool-header__icon" }, tool.icon),
        h("div", { class: "tool-header__text" },
          h("h1", {}, name, locked ? h("span", { class: "premium-tag" }, "★ " + t("auth.pwBadge")) : null),
          h("p", {}, tt(tool, "tagline"))),
        h("div", { class: "tool-header__actions" }, askBtn, favBtn)),
      h("div", { class: "tool-layout" },
        h("div", {}, panel),
        sidebar(tool)),
      contentBlock(tool, name)));

  root.append(page);

  if (!locked) {
    try { tool.mount(toolRoot, { tool }); }
    catch (e) {
      console.error("[tool] mount failed", e);
      toolRoot.append(h("div", { class: "empty-state" }, h("div", { class: "empty-state__icon" }, "⚠️"), t("toolPage.mountError")));
    }
  }
  observeReveals(page);

  const cleanup = () => toolRoot.dispatchEvent(new CustomEvent("tool:unmount"));
  window.addEventListener("hashchange", cleanup, { once: true });
}

function breadcrumb(cat, name) {
  return h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" },
    h("a", { href: "#/" }, t("common.home")),
    h("span", { class: "breadcrumb__sep" }, "/"),
    h("a", { href: `#/category/${cat.id}` }, catName(cat.id)),
    h("span", { class: "breadcrumb__sep" }, "/"),
    h("span", { style: { color: "var(--text)" } }, name));
}

function sidebar(tool) {
  const related = relatedTools(tool.id, 4);
  const side = h("aside", { class: "tool-side" });
  const steps = tt(tool, "steps"), tips = tt(tool, "tips");

  if (steps?.length) {
    side.append(h("div", { class: "side-card reveal" },
      h("h3", {}, h("span", { html: icon("info") }), t("toolPage.howTo")),
      h("ul", {}, ...steps.map((s) => h("li", {}, s)))));
  }
  if (tips?.length) {
    side.append(h("div", { class: "side-card reveal" },
      h("h3", {}, h("span", { html: icon("sparkle") }), t("toolPage.tips")),
      h("ul", {}, ...tips.map((tp) => h("li", {}, tp)))));
  }
  if (related.length) {
    const box = h("div", { class: "side-card reveal" }, h("h3", {}, h("span", { html: icon("grid") }), t("toolPage.related")));
    related.forEach((r) => {
      const rt = h("div", { class: "related-tool", onclick: () => navigate(`/tool/${r.id}`) },
        h("span", { class: "related-tool__icon" }, r.icon),
        h("div", {}, h("div", { class: "related-tool__name" }, tt(r, "name"))));
      box.append(rt);
    });
    side.append(box);
  }
  return side;
}

function contentBlock(tool, name) {
  const about = tt(tool, "about"), faqs = tt(tool, "faqs");
  if (!about && !faqs?.length) return h("div");
  const prose = h("div", { class: "prose container" });
  if (about) {
    prose.append(
      h("h2", { class: "reveal" }, t("toolPage.about", { name })),
      h("p", { class: "reveal" }, about));
  }
  if (faqs?.length) {
    prose.append(h("h2", { class: "reveal" }, t("toolPage.faq")));
    const list = h("div", { class: "faq-list", style: { margin: 0 } });
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
    prose.append(list);
  }
  return prose;
}

/* ---------------- Listing ---------------- */
export function renderListing(root, { title, lead, tools, eyebrow }) {
  setSEO({ title: `${title} — LifeTools`, description: lead });
  root.innerHTML = "";
  const grid = h("div", { class: "tool-grid" });
  tools.forEach((tool) => grid.append(toolCard(tool)));
  const page = h("div", { class: "section container view" },
    h("div", { class: "section__head reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), eyebrow || t("nav.tools")),
      h("h1", { class: "section__title" }, title),
      lead && h("p", { class: "section__lead" }, lead)),
    tools.length ? grid : emptyState());
  root.append(page);
  observeReveals(page);
}

export function renderAllTools(root) {
  renderListing(root, { title: t("listing.all"), lead: t("listing.allLead", { n: allTools().length }), tools: allTools(), eyebrow: t("listing.everything") });
}

export function renderCategory(root, id) {
  const cat = categoryMap[id];
  if (!cat) return renderNotFound(root);
  renderListing(root, {
    title: catName(id) + t("listing.catSuffix"),
    lead: t(`cat.${id}Blurb`),
    tools: toolsByCategory(id),
    eyebrow: `${cat.icon} ${t("listing.category")}`,
  });
}

export function renderFavorites(root) {
  const favs = store.get("favorites").map(getTool).filter(Boolean);
  if (!favs.length) {
    root.innerHTML = "";
    root.append(h("div", { class: "section container view" },
      h("div", { class: "empty-state" },
        h("div", { class: "empty-state__icon" }, "⭐"),
        h("h2", { style: { marginBottom: ".5rem" } }, t("listing.favEmptyTitle")),
        h("p", { style: { marginBottom: "1.5rem" } }, t("listing.favEmptyText")),
        h("button", { class: "btn btn--primary", onclick: () => navigate("/tools") }, t("listing.browse")))));
    setSEO({ title: t("listing.favTitle") + " — LifeTools", description: t("listing.favLead") });
    return;
  }
  renderListing(root, { title: t("listing.favTitle"), lead: t("listing.favLead"), tools: favs, eyebrow: t("listing.saved") });
}

function emptyState() {
  return h("div", { class: "empty-state" },
    h("div", { class: "empty-state__icon" }, "🔍"),
    h("p", {}, t("listing.empty")));
}

export function renderNotFound(root) {
  setSEO({ title: t("notFound.title") + " — LifeTools", description: t("notFound.text") });
  root.innerHTML = "";
  root.append(h("div", { class: "section container view" },
    h("div", { class: "empty-state" },
      h("div", { class: "empty-state__icon" }, "🧭"),
      h("h2", { style: { marginBottom: ".5rem" } }, t("notFound.title")),
      h("p", { style: { marginBottom: "1.5rem" } }, t("notFound.text")),
      h("button", { class: "btn btn--primary", onclick: () => navigate("/") }, t("notFound.back")))));
}
