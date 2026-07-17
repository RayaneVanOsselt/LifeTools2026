/**
 * Command-palette search — fuzzy tool search with keyboard navigation,
 * recent tools, and category context. Opens with the nav trigger or ⌘/Ctrl-K.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { allTools, categoryMap, getTool } from "../core/registry.js";
import { store } from "../core/store.js";
import { navigate } from "../core/router.js";

/** Score a tool against a query. Higher is better; 0 = no match. */
export function scoreTool(tool, q) {
  if (!q) return 1;
  q = q.toLowerCase();
  const name = tool.name.toLowerCase();
  const hay = `${name} ${tool.tagline} ${tool.keywords.join(" ")} ${categoryMap[tool.category].name}`.toLowerCase();
  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;
  if (tool.keywords.some((k) => k.toLowerCase().startsWith(q))) return 50;
  if (hay.includes(q)) return 30;
  // subsequence match on name (fuzzy)
  let i = 0;
  for (const ch of name) if (ch === q[i]) i++;
  return i === q.length ? 15 : 0;
}

export function searchTools(q, limit = 8) {
  return allTools()
    .map((t) => ({ t, s: scoreTool(t, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.t);
}

export function initSearch() {
  const input = h("input", { type: "text", placeholder: "Search tools…", "aria-label": "Search tools" });
  const results = h("div", { class: "search-results" });
  const panel = h("div", { class: "search-panel", role: "dialog", "aria-label": "Search" },
    h("div", { class: "search-panel__head" },
      h("span", { style: { color: "var(--text-mute)" }, html: icon("search") }),
      input,
      h("kbd", { style: { fontFamily: "var(--font-mono)", fontSize: ".7rem", padding: "2px 6px", borderRadius: "6px", background: "var(--bg-sunken)" } }, "ESC")),
    results);
  const overlay = h("div", { class: "search-overlay" }, panel);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.body.append(overlay);

  let items = [], highlighted = 0;

  function render(q) {
    results.innerHTML = "";
    const recents = store.get("recents").map(getTool).filter(Boolean);
    if (!q && recents.length) {
      results.append(h("div", { class: "search-section-label" }, "Recently used"));
      recents.slice(0, 4).forEach((t) => results.append(itemEl(t)));
      results.append(h("div", { class: "search-section-label" }, "All tools"));
      items = [...recents.slice(0, 4)];
      allTools().slice(0, 6).forEach((t) => { items.push(t); results.append(itemEl(t)); });
    } else {
      const found = searchTools(q, 10);
      items = found;
      if (!found.length) {
        results.append(h("div", { class: "search-empty" }, `No tools match “${q}”. Try “loan”, “bmi”, or “convert”.`));
      } else {
        found.forEach((t) => results.append(itemEl(t)));
      }
    }
    highlighted = 0; paintHighlight();
  }

  function itemEl(t) {
    const cat = categoryMap[t.category];
    const el = h("div", { class: "search-item", style: { "--card-accent": cat.accent }, dataset: { id: t.id } },
      h("span", { class: "search-item__icon" }, t.icon),
      h("div", { class: "search-item__body" },
        h("div", { class: "search-item__title" }, t.name),
        h("div", { class: "search-item__sub" }, t.tagline)),
      h("span", { class: "search-item__enter", html: "↵" }));
    el.addEventListener("click", () => choose(t));
    el.addEventListener("mousemove", () => { highlighted = items.indexOf(t); paintHighlight(); });
    return el;
  }

  function paintHighlight() {
    [...results.querySelectorAll(".search-item")].forEach((el, i) =>
      el.classList.toggle("is-highlighted", i === highlighted));
    results.querySelectorAll(".search-item")[highlighted]?.scrollIntoView({ block: "nearest" });
  }

  function choose(t) { navigate(`/tool/${t.id}`); close(); }

  function open() {
    overlay.classList.add("is-open");
    input.value = ""; render("");
    setTimeout(() => input.focus(), 50);
  }
  function close() { overlay.classList.remove("is-open"); }

  input.addEventListener("input", () => render(input.value.trim()));
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") { e.preventDefault(); highlighted = Math.min(items.length - 1, highlighted + 1); paintHighlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); highlighted = Math.max(0, highlighted - 1); paintHighlight(); }
    else if (e.key === "Enter" && items[highlighted]) { choose(items[highlighted]); }
  });

  return { open, close };
}
