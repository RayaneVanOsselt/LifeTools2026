/**
 * Access control — the single source of truth for "can this user use this tool?".
 *
 * Used at three levels (never rely on hiding a button alone):
 *   1. UI         — badges/locks on tool cards (components.js)
 *   2. Navigation — the tool route renders a paywall instead of the tool (views.js)
 *   3. Logic      — the tool's mount() is never called while locked (views.js)
 *
 * Premium is decided by category (Productivity, Developer, Converters), with an
 * optional per-tool override (`tool.access = "free" | "premium"`) so the split
 * can be fine-tuned later without code changes elsewhere.
 */
import { subscription } from "./subscription.js";
import { auth } from "./auth.js";

export const PREMIUM_CATEGORIES = new Set(["productivity", "developer", "conversion"]);

export const ACCESS = { AVAILABLE: "AVAILABLE", PREMIUM: "PREMIUM" };

export function isPremiumTool(tool) {
  if (!tool) return false;
  if (tool.access === "premium") return true;
  if (tool.access === "free") return false;
  return PREMIUM_CATEGORIES.has(tool.category);
}

/** AVAILABLE if usable now, PREMIUM if locked behind an upgrade. */
export function accessLevel(tool, user = auth.currentUser()) {
  if (!isPremiumTool(tool)) return ACCESS.AVAILABLE;
  return subscription.isPremium(user) ? ACCESS.AVAILABLE : ACCESS.PREMIUM;
}

export function canUse(tool, user = auth.currentUser()) {
  return accessLevel(tool, user) === ACCESS.AVAILABLE;
}
