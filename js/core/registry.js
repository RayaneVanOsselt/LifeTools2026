/**
 * Tool registry — the single source of truth for the whole platform.
 * Tools register themselves here; navigation, search, homepage grids, and the
 * AI assistant all read from this registry. Adding a tool never touches the UI.
 */

export const categories = [
  { id: "finance",      name: "Finance",       icon: "💰", accent: "#0a92b9", blurb: "Money, loans, tax & savings" },
  { id: "health",       name: "Health & Life", icon: "❤️", accent: "#c18440", blurb: "Body, wellbeing & habits" },
  { id: "productivity", name: "Productivity",  icon: "⚡", accent: "#7d8118", blurb: "Write, plan & get things done" },
  { id: "developer",    name: "Developer",     icon: "⌨️", accent: "#1f8a76", blurb: "Code, design & data tools" },
  { id: "conversion",   name: "Converters",    icon: "🔄", accent: "#2f6f5a", blurb: "Units, currency & files" },
];

export const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

const _tools = new Map();

/**
 * Register a tool.
 * @param {object} def
 *  id, name, category, icon(emoji), tagline, keywords[],
 *  badge?, featured?, mount(root, ctx), about?, steps?[], tips?[], faqs?[]
 */
export function register(def) {
  if (_tools.has(def.id)) console.warn(`[registry] duplicate tool id: ${def.id}`);
  const cat = categoryMap[def.category];
  _tools.set(def.id, {
    accent: cat?.accent || "#0a92b9",
    keywords: [],
    steps: [],
    tips: [],
    faqs: [],
    ...def,
  });
}

export function getTool(id) { return _tools.get(id); }
export function allTools() { return [..._tools.values()]; }
export function toolsByCategory(catId) { return allTools().filter((t) => t.category === catId); }
export function featuredTools() { return allTools().filter((t) => t.featured); }
export function newTools() { return allTools().filter((t) => t.badge === "New"); }

export function relatedTools(id, limit = 4) {
  const tool = getTool(id);
  if (!tool) return [];
  return allTools()
    .filter((t) => t.id !== id && t.category === tool.category)
    .slice(0, limit);
}

export function toolCount() { return _tools.size; }
