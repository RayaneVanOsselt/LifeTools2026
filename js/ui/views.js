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

/* ---------------- Tool page ---------------- */
export function renderTool(root, id) {
  const tool = getTool(id);
  if (!tool) return renderNotFound(root);
  pushRecent(id);
  const cat = categoryMap[tool.category];
  setSEO({
    title: `${tool.name} — LifeTools`,
    description: tool.about || tool.tagline,
    faqs: tool.faqs,
    name: tool.name,
  });

  root.innerHTML = "";
  const favBtn = h("button", { class: `btn btn--ghost ${isFavorite(id) ? "is-fav" : ""}`,
    html: `${icon("star")} <span>${isFavorite(id) ? "Saved" : "Save"}</span>` });
  favBtn.addEventListener("click", () => {
    const on = toggleFavorite(id);
    favBtn.innerHTML = `${icon("star")} <span>${on ? "Saved" : "Save"}</span>`;
    favBtn.querySelector("svg").style.fill = on ? "var(--amber-500)" : "none";
    toast(on ? "Saved to favorites" : "Removed from favorites", "success", 1500);
  });
  if (isFavorite(id)) favBtn.querySelector("svg").style.fill = "var(--amber-500)";

  const askBtn = h("button", { class: "btn btn--soft", html: `${icon("sparkle")} Ask AI`,
    onclick: () => window.LifeToolsAssistant?.askAbout(tool.name) });

  const toolRoot = h("div"); // where the interactive tool mounts

  const page = h("div", { class: "tool-page view", style: { "--card-accent": cat.accent } },
    h("div", { class: "container" },
      breadcrumb(cat, tool),
      h("div", { class: "tool-header" },
        h("div", { class: "tool-header__icon" }, tool.icon),
        h("div", { class: "tool-header__text" },
          h("h1", {}, tool.name),
          h("p", {}, tool.tagline)),
        h("div", { class: "tool-header__actions" }, askBtn, favBtn)),
      h("div", { class: "tool-layout" },
        h("div", {}, h("div", { class: "tool-panel" }, toolRoot)),
        sidebar(tool)),
      contentBlock(tool)));

  root.append(page);

  // Mount the interactive tool; guard against tool errors.
  try { tool.mount(toolRoot, { tool }); }
  catch (e) {
    console.error("[tool] mount failed", e);
    toolRoot.append(h("div", { class: "empty-state" }, h("div", { class: "empty-state__icon" }, "⚠️"), "This tool hit an error. Please refresh."));
  }
  observeReveals(page);

  // Fire an unmount event when navigating away (for timers etc.)
  const cleanup = () => toolRoot.dispatchEvent(new CustomEvent("tool:unmount"));
  window.addEventListener("hashchange", cleanup, { once: true });
}

function breadcrumb(cat, tool) {
  return h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" },
    h("a", { href: "#/" }, "Home"),
    h("span", { class: "breadcrumb__sep" }, "/"),
    h("a", { href: `#/category/${cat.id}` }, cat.name),
    h("span", { class: "breadcrumb__sep" }, "/"),
    h("span", { style: { color: "var(--text)" } }, tool.name));
}

function sidebar(tool) {
  const related = relatedTools(tool.id, 4);
  const side = h("aside", { class: "tool-side" });

  if (tool.steps?.length) {
    side.append(h("div", { class: "side-card reveal" },
      h("h3", {}, h("span", { html: icon("info") }), "How to use"),
      h("ul", {}, ...tool.steps.map((s) => h("li", {}, s)))));
  }
  if (tool.tips?.length) {
    side.append(h("div", { class: "side-card reveal" },
      h("h3", {}, h("span", { html: icon("sparkle") }), "Pro tips"),
      h("ul", {}, ...tool.tips.map((t) => h("li", {}, t)))));
  }
  if (related.length) {
    const box = h("div", { class: "side-card reveal" }, h("h3", {}, h("span", { html: icon("grid") }), "Related tools"));
    related.forEach((r) => {
      const rt = h("div", { class: "related-tool", onclick: () => navigate(`/tool/${r.id}`) },
        h("span", { class: "related-tool__icon" }, r.icon),
        h("div", {}, h("div", { class: "related-tool__name" }, r.name)));
      box.append(rt);
    });
    side.append(box);
  }
  return side;
}

function contentBlock(tool) {
  if (!tool.about && !tool.faqs?.length) return h("div");
  const prose = h("div", { class: "prose container" });
  if (tool.about) {
    prose.append(
      h("h2", { class: "reveal" }, `About the ${tool.name}`),
      h("p", { class: "reveal" }, tool.about));
  }
  if (tool.faqs?.length) {
    prose.append(h("h2", { class: "reveal" }, "Frequently asked questions"));
    const list = h("div", { class: "faq-list", style: { margin: 0 } });
    for (const f of tool.faqs) {
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
  tools.forEach((t) => grid.append(toolCard(t)));
  const page = h("div", { class: "section container view" },
    h("div", { class: "section__head reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), eyebrow || "Tools"),
      h("h1", { class: "section__title" }, title),
      lead && h("p", { class: "section__lead" }, lead)),
    tools.length ? grid : emptyState());
  root.append(page);
  observeReveals(page);
}

export function renderAllTools(root) {
  renderListing(root, { title: "All Tools", lead: `Browse the full LifeTools collection — ${allTools().length} tools and counting.`, tools: allTools(), eyebrow: "Everything" });
}

export function renderCategory(root, id) {
  const cat = categoryMap[id];
  if (!cat) return renderNotFound(root);
  renderListing(root, { title: cat.name + " Tools", lead: cat.blurb, tools: toolsByCategory(id), eyebrow: `${cat.icon} Category` });
}

export function renderFavorites(root) {
  const favs = store.get("favorites").map(getTool).filter(Boolean);
  if (!favs.length) {
    root.innerHTML = "";
    root.append(h("div", { class: "section container view" },
      h("div", { class: "empty-state" },
        h("div", { class: "empty-state__icon" }, "⭐"),
        h("h2", { style: { marginBottom: ".5rem" } }, "No favorites yet"),
        h("p", { style: { marginBottom: "1.5rem" } }, "Star tools you use often and they'll appear here for quick access."),
        h("button", { class: "btn btn--primary", onclick: () => navigate("/tools") }, "Browse tools"))));
    setSEO({ title: "Favorites — LifeTools", description: "Your saved tools." });
    return;
  }
  renderListing(root, { title: "Your Favorites", lead: "Your starred tools, ready to go.", tools: favs, eyebrow: "Saved" });
}

function emptyState() {
  return h("div", { class: "empty-state" },
    h("div", { class: "empty-state__icon" }, "🔍"),
    h("p", {}, "No tools here yet."));
}

export function renderNotFound(root) {
  setSEO({ title: "Not found — LifeTools", description: "Page not found." });
  root.innerHTML = "";
  root.append(h("div", { class: "section container view" },
    h("div", { class: "empty-state" },
      h("div", { class: "empty-state__icon" }, "🧭"),
      h("h2", { style: { marginBottom: ".5rem" } }, "Page not found"),
      h("p", { style: { marginBottom: "1.5rem" } }, "The tool or page you're looking for doesn't exist."),
      h("button", { class: "btn btn--primary", onclick: () => navigate("/") }, "Back home"))));
}
