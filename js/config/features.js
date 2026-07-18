/**
 * ════════════════════════════════════════════════════════════════════════
 *  FEATURE ACCESS — the SINGLE source of truth for what is free vs premium.
 * ════════════════════════════════════════════════════════════════════════
 *
 *  Every tool ("feature") is configured INDIVIDUALLY here. There is no global
 *  rule and no "everything is premium" — each line is independent.
 *
 *  To change a tool:   set its value to "free" or "premium" (one word).
 *  To add a tool:      add a line `"<tool-id>": "free" | "premium"`.
 *  To remove a tool:   delete its line (it then falls back to DEFAULT_ACCESS).
 *
 *  A tool id that is NOT listed here defaults to DEFAULT_ACCESS (free), so a
 *  newly added tool is never accidentally locked.
 *
 *  Current split: 15 free · 20 premium (fully editable below).
 *
 *  ↔ Evolving later: this flat map can grow into multi-plan access without
 *    breaking callers, e.g. `"reports": { plans: ["pro", "team"] }`. The
 *    resolver `featureAccess()` is the only place that would change.
 */

export const ACCESS_LEVELS = { FREE: "free", PREMIUM: "premium" };

/** A tool not listed below uses this level. */
export const DEFAULT_ACCESS = ACCESS_LEVELS.FREE;

export const FEATURE_ACCESS = {
  // ── Finance ─────────────────────────────
  "vat":                    "free",
  "loan":                   "free",
  "mortgage":               "free",
  "compound-interest":      "free",
  "savings":                "free",
  "investment-return":      "free",
  "salary":                 "free",
  "budget":                 "free",
  "currency":               "free",

  // ── Health & Life ───────────────────────
  "bmi":                    "free",
  "calories":               "free",
  "water":                  "free",
  "age":                    "free",
  "sleep":                  "free",
  "habits":                 "free",

  // ── Productivity ────────────────────────
  "word-counter":           "premium",
  "password":               "premium",
  "name-generator":         "premium",
  "qr-code":                "premium",
  "pomodoro":               "premium",
  "todo":                   "premium",

  // ── Developer ───────────────────────────
  "gradient":               "premium",
  "box-shadow":             "premium",
  "border-radius":          "premium",
  "color-palette":          "premium",
  "json-formatter":         "premium",
  "html-encode":            "premium",
  "timestamp":              "premium",
  "lorem":                  "premium",

  // ── Converters ──────────────────────────
  "unit-converter":         "premium",
  "length-converter":       "premium",
  "weight-converter":       "premium",
  "temperature-converter":  "premium",
  "time-converter":         "premium",
  "filesize-converter":     "premium",
};

/** Resolve a tool id to its access level ("free" | "premium"). */
export function featureAccess(toolId) {
  return FEATURE_ACCESS[toolId] || DEFAULT_ACCESS;
}
