/**
 * Access control — the single runtime authority for "can this user use this tool?".
 *
 * Enforced at three levels (never rely on hiding a button alone):
 *   1. UI         — badges/locks on tool cards (components.js)
 *   2. Navigation — the tool route renders a paywall instead of the tool (views.js)
 *   3. Logic      — the tool's mount() is never called while locked (views.js)
 *
 * WHICH tools are premium is configured per-feature in `config/features.js`
 * (the single editable table). A tool may also override it inline in the
 * registry via `tool.access = "free" | "premium"`, which wins if present.
 */
import { subscription } from "./subscription.js";
import { auth } from "./auth.js";
import { featureAccess, ACCESS_LEVELS } from "../config/features.js";

export const ACCESS = { AVAILABLE: "AVAILABLE", PREMIUM: "PREMIUM" };

export function isPremiumTool(tool) {
  if (!tool) return false;
  const level = tool.access || featureAccess(tool.id);   // inline override wins
  return level === ACCESS_LEVELS.PREMIUM;
}

/** AVAILABLE if usable now, PREMIUM if locked behind an upgrade. */
export function accessLevel(tool, user = auth.currentUser()) {
  if (!isPremiumTool(tool)) return ACCESS.AVAILABLE;
  return subscription.isPremium(user) ? ACCESS.AVAILABLE : ACCESS.PREMIUM;
}

export function canUse(tool, user = auth.currentUser()) {
  return accessLevel(tool, user) === ACCESS.AVAILABLE;
}
