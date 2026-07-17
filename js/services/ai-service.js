/**
 * AI service — the single integration point for the LifeTools assistant.
 *
 * Today it runs a local, intent-based responder so the assistant works offline
 * with zero cost. Intent matching accepts English, French and Dutch keywords,
 * and every reply is rendered in the active language. The `ask` interface is
 * async and provider-shaped so a real backend (OpenAI, Anthropic, …) can be
 * dropped in later WITHOUT touching the chat UI — implement `remoteComplete`
 * and flip `USE_REMOTE`.
 */
import { allTools, categories, getTool } from "../core/registry.js";
import { t, tt } from "../core/i18n.js";

const USE_REMOTE = false;
const ENDPOINT = "/api/assistant";

export async function ask(message, ctx = {}) {
  if (USE_REMOTE) {
    try { return await remoteComplete(message, ctx); }
    catch (e) { console.warn("[ai] remote failed, falling back", e); }
  }
  return localComplete(message);
}

async function remoteComplete(message, ctx) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: ctx.history || [],
      tools: allTools().map((x) => ({ id: x.id, name: x.name, tagline: x.tagline, category: x.category })),
    }),
  });
  if (!res.ok) throw new Error(`assistant ${res.status}`);
  return res.json();
}

/* --------------------------------------------------------------------------
   Local intent engine — keyword matching (EN/FR/NL) against the tool registry.
   Each intent maps a pattern to either a tool id or a special reply kind.
   -------------------------------------------------------------------------- */
const INTENTS = [
  { kind: "greeting", rx: /^\s*(hi|hello|hey|yo|hallo|bonjour|salut|hoi|hey)\b/i },
  { kind: "thanks", rx: /\b(thanks|thank you|thx|merci|cheers|bedankt|dank je|dankjewel)\b/i },

  { tool: "savings", rx: /\b(save|saving|savings|put aside|épargn|epargn|sparen|spaar|opzij)\b/i },
  { tool: "mortgage", rx: /\b(mortgage|home loan|hypothe|hypotheek|crédit immobilier|credit immobilier|maison)\b/i },
  { tool: "loan", rx: /\b(loan|borrow|credit|repay|emi|prêt|pret|emprunt|lening|lenen|krediet)\b/i },
  { tool: "vat", rx: /\b(vat|btw|tva|sales tax|taxe)\b/i },
  { tool: "salary", rx: /\b(salary|net pay|take home|gross|wage|salaire|net|brut|salaris|loon|nettoloon)\b/i },
  { tool: "compound-interest", rx: /\b(compound|interest|invest|grow money|intérêt|interet|composé|samengestelde|rente)\b/i },
  { tool: "budget", rx: /\b(budget|expenses|spending|50\/30\/20|dépense|depense|uitgaven|begroting)\b/i },
  { tool: "currency", rx: /\b(currency|exchange|forex|devise|change|valuta|wisselkoers|dollar|euro)\b/i },
  { tool: "bmi", rx: /\b(bmi|body mass|imc|overweight|surpoids|overgewicht)\b/i },
  { tool: "calories", rx: /\b(calorie|tdee|bmr|diet|lose weight|maigrir|régime|regime|calorie|afvallen|dieet)\b/i },
  { tool: "water", rx: /\b(water|hydration|drink|eau|hydrat|boire|drinken)\b/i },
  { tool: "age", rx: /\b(age|how old|birthday|âge|anniversaire|leeftijd|verjaardag)\b/i },
  { tool: "sleep", rx: /\b(sleep|bedtime|wake up|sommeil|dormir|coucher|slaap|slapen)\b/i },
  { tool: "habits", rx: /\b(habit|streak|routine|habitude|gewoonte)\b/i },
  { tool: "word-counter", rx: /\b(word|character|count|reading time|mot|caractère|caractere|compter|woord|teken|tellen)\b/i },
  { tool: "password", rx: /\b(password|secure|mot de passe|wachtwoord|sécuris)\b/i },
  { tool: "qr-code", rx: /\b(qr|qr code|scan)\b/i },
  { tool: "pomodoro", rx: /\b(pomodoro|focus timer|study timer|concentration|minuteur)\b/i },
  { tool: "todo", rx: /\b(todo|to-do|task|checklist|tâche|tache|taak|takenlijst)\b/i },
  { tool: "gradient", rx: /\b(gradient|dégradé|degrade)\b/i },
  { tool: "box-shadow", rx: /\b(shadow|box.?shadow|ombre|schaduw)\b/i },
  { tool: "border-radius", rx: /\b(border.?radius|rounded|arrondi|afgerond)\b/i },
  { tool: "color-palette", rx: /\b(color|colour|palette|hex|couleur|kleur)\b/i },
  { tool: "json-formatter", rx: /\b(json|format|beautify|minify)\b/i },
  { tool: "timestamp", rx: /\b(timestamp|unix|epoch)\b/i },
  { tool: "lorem", rx: /\b(lorem|ipsum|placeholder|dummy)\b/i },
  { tool: "unit-converter", rx: /\b(convert|unit|kg|pound|livre|mile|km|celsius|fahrenheit|feet|meter|mètre|metre|convertir|omzetten|pond|eenheid)\b/i },
  { tool: "name-generator", rx: /\b(name generator|username|brand name|générateur de nom|pseudo|naam)\b/i },

  { kind: "help", rx: /\b(help|how (does|do)|what (can|is)|guide|comment|aide|quoi|hoe|wat|hulp|tools?|outils?)\b/i },
];

function recommend(toolId) {
  const tool = getTool(toolId);
  if (!tool) return { text: t("assistant.fallback") };
  const name = tt(tool, "name");
  const link = `<a href="#/tool/${tool.id}" data-tool="${tool.id}">${name}</a>`;
  return {
    text: t("assistant.recommend", { link, desc: tt(tool, "tagline") }),
    actions: [{ label: t("assistant.openTool", { name }), toolId: tool.id }],
  };
}

function localComplete(message) {
  for (const intent of INTENTS) {
    if (!intent.rx.test(message)) continue;
    if (intent.kind === "greeting") return { text: t("assistant.replyGreeting") };
    if (intent.kind === "thanks") return { text: t("assistant.replyThanks") };
    if (intent.kind === "help") {
      return { text: t("assistant.replyHelp", {
        count: allTools().length,
        cats: categories.length,
        list: categories.map((c) => t(`cat.${c.id}`)).join(", "),
      }) };
    }
    return recommend(intent.tool);
  }
  // Fuzzy fallback — keyword overlap against the registry (both languages).
  const words = message.toLowerCase().match(/[\p{L}]{3,}/gu) || [];
  let best = null, bestScore = 0;
  for (const tool of allTools()) {
    const hay = `${tool.name} ${tt(tool, "name")} ${tool.tagline} ${tt(tool, "tagline")} ${tool.keywords.join(" ")}`.toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = tool; }
  }
  if (best && bestScore > 0) return recommend(best.id);
  return { text: t("assistant.fallback"), actions: [{ label: t("assistant.browseAll"), toolId: "__browse" }] };
}
