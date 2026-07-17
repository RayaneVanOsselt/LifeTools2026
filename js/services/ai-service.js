/**
 * AI service — the single integration point for the LifeTools assistant.
 *
 * Today it runs a local, intent-based responder so the assistant works offline
 * with zero cost. The interface (`ask`) is deliberately async and provider-shaped
 * so a real backend (OpenAI, Anthropic, etc.) can be dropped in later WITHOUT
 * touching the chat UI — just implement `remoteComplete` and flip `USE_REMOTE`.
 */
import { allTools, categories, getTool } from "../core/registry.js";

const USE_REMOTE = false; // flip to true once a backend endpoint is configured
const ENDPOINT = "/api/assistant"; // future serverless function / proxy

/**
 * Public API. Returns { text, actions?: [{label, toolId}] }.
 * @param {string} message
 * @param {{history?: Array}} ctx
 */
export async function ask(message, ctx = {}) {
  if (USE_REMOTE) {
    try { return await remoteComplete(message, ctx); }
    catch (e) { console.warn("[ai] remote failed, falling back", e); }
  }
  return localComplete(message);
}

/** Placeholder for the future networked implementation. */
async function remoteComplete(message, ctx) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: ctx.history || [],
      // The tool catalog is sent so the model can recommend real tools.
      tools: allTools().map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, category: t.category })),
    }),
  });
  if (!res.ok) throw new Error(`assistant ${res.status}`);
  return res.json();
}

/* --------------------------------------------------------------------------
   Local intent engine — keyword & synonym matching against the tool registry.
   -------------------------------------------------------------------------- */

const INTENTS = [
  { rx: /^\s*(hi|hello|hey|yo|hallo|bonjour|salut)\b/i, reply: () =>
    ({ text: "👋 Hi! I'm your LifeTools assistant. Tell me what you're trying to do — save money, calculate something, convert units — and I'll point you to the right tool." }) },
  { rx: /\b(thank|thx|merci|cheers)\b/i, reply: () => ({ text: "You're welcome! 🙌 Anything else I can help you find?" }) },
  { rx: /\b(save|saving|savings|put aside|set aside)\b/i, reply: () => recommend("savings", "To plan your monthly savings, use the") },
  { rx: /\b(loan|borrow|credit|repay|emi)\b/i, reply: () => recommend("loan", "For loan repayments, try the") },
  { rx: /\b(mortgage|home loan|house)\b/i, reply: () => recommend("mortgage", "For a home loan, use the") },
  { rx: /\b(vat|btw|tva|sales tax)\b/i, reply: () => recommend("vat", "To add or remove tax, use the") },
  { rx: /\b(salary|net pay|take home|gross|wage)\b/i, reply: () => recommend("salary", "To estimate take-home pay, use the") },
  { rx: /\b(compound|interest|invest|grow money|returns?)\b/i, reply: () => recommend("compound-interest", "To see how your money grows, use the") },
  { rx: /\b(budget|expenses|spending|50\/30\/20)\b/i, reply: () => recommend("budget", "To plan your budget, use the") },
  { rx: /\b(currency|exchange|convert.*(money|usd|eur|dollar|euro))\b/i, reply: () => recommend("currency", "To convert currencies, use the") },
  { rx: /\b(bmi|body mass|am i (over|under)weight)\b/i, reply: () => recommend("bmi", "To check your BMI, use the") },
  { rx: /\b(calorie|tdee|bmr|diet|lose weight|macros)\b/i, reply: () => recommend("calories", "For daily calories, use the") },
  { rx: /\b(water|hydration|drink)\b/i, reply: () => recommend("water", "For daily water intake, use the") },
  { rx: /\b(age|how old|birthday)\b/i, reply: () => recommend("age", "To calculate your exact age, use the") },
  { rx: /\b(sleep|bedtime|wake up)\b/i, reply: () => recommend("sleep", "For ideal sleep times, use the") },
  { rx: /\b(habit|streak|routine)\b/i, reply: () => recommend("habits", "To build habits, use the") },
  { rx: /\b(word|character|count|reading time)\b/i, reply: () => recommend("word-counter", "To count words and characters, use the") },
  { rx: /\b(password|secure|random pass)\b/i, reply: () => recommend("password", "For a strong password, use the") },
  { rx: /\b(qr|qr code|scan)\b/i, reply: () => recommend("qr-code", "To make a QR code, use the") },
  { rx: /\b(pomodoro|focus timer|study timer)\b/i, reply: () => recommend("pomodoro", "To focus in sprints, use the") },
  { rx: /\b(todo|to-do|task|checklist)\b/i, reply: () => recommend("todo", "To manage tasks, use the") },
  { rx: /\b(gradient)\b/i, reply: () => recommend("gradient", "To design a gradient, use the") },
  { rx: /\b(shadow|box.?shadow)\b/i, reply: () => recommend("box-shadow", "For CSS shadows, use the") },
  { rx: /\b(border.?radius|rounded)\b/i, reply: () => recommend("border-radius", "For rounded corners, use the") },
  { rx: /\b(color|colour|palette|hex)\b/i, reply: () => recommend("color-palette", "For a color palette, use the") },
  { rx: /\b(json|format|beautify|minify)\b/i, reply: () => recommend("json-formatter", "To format JSON, use the") },
  { rx: /\b(timestamp|unix|epoch)\b/i, reply: () => recommend("timestamp", "To convert timestamps, use the") },
  { rx: /\b(lorem|ipsum|placeholder text|dummy text)\b/i, reply: () => recommend("lorem", "For placeholder text, use the") },
  { rx: /\b(convert|unit|kg|pounds?|miles?|km|celsius|fahrenheit|feet|meters?)\b/i, reply: () => recommend("unit-converter", "For measurements, use the") },
  { rx: /\b(name generator|username|brand name|project name)\b/i, reply: () => recommend("name-generator", "For random names, use the") },
  // Broad catch-all for general "what can you do / help" queries — checked last
  // so tool-specific questions like "how do I calculate my loan?" win first.
  { rx: /\b(help|how (does|do)|what (can|is)|guide|get started|categories|tools?)\b/i, reply: () =>
    ({ text: `LifeTools has ${allTools().length}+ free tools across ${categories.length} categories: ${categories.map((c) => c.name).join(", ")}. Ask me things like “how do I calculate my loan?” or “convert kg to pounds”.` }) },
];

function recommend(toolId, lead) {
  const t = getTool(toolId);
  if (!t) return { text: "I couldn't find that tool, but browse the categories on the homepage." };
  return {
    text: `${lead} <a href="#/tool/${t.id}" data-tool="${t.id}">${t.name}</a>. ${t.tagline}`,
    actions: [{ label: `Open ${t.name}`, toolId: t.id }],
  };
}

function localComplete(message) {
  for (const intent of INTENTS) {
    if (intent.rx.test(message)) return intent.reply();
  }
  // Fuzzy fallback: search the registry by keyword overlap.
  const words = message.toLowerCase().match(/[a-z]{3,}/g) || [];
  let best = null, bestScore = 0;
  for (const t of allTools()) {
    const hay = `${t.name} ${t.tagline} ${t.keywords.join(" ")}`.toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  if (best && bestScore > 0) return recommend(best.id, "Sounds like you want the");
  return {
    text: "I'm not sure yet — try describing your goal (e.g. “calculate a loan”, “convert kg to lb”, “make a password”). You can also browse all tools from the menu.",
    actions: [{ label: "Browse all tools", toolId: "__browse" }],
  };
}

/** Suggested opening prompts shown as quick-reply chips. */
export const QUICK_PROMPTS = [
  "How do I calculate my loan?",
  "Help me save each month",
  "Convert kg to pounds",
  "Make a strong password",
];
