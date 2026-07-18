# LifeTools

A premium, framework-free web platform — a complete ecosystem of smart everyday
tools for finance, health, productivity, development and conversions.

Built with **only** HTML5, CSS3 and modern Vanilla JavaScript (ES6+). No React,
Vue, Bootstrap, Tailwind, or jQuery.

## Highlights

- **35+ working tools** across 5 categories, all with live calculations,
  animated results, charts, explanations, FAQs and related-tool suggestions.
- **Scalable architecture** — a central tool _registry_ drives navigation,
  search, the homepage and the AI assistant. Adding a tool never touches the UI.
- **Built-in AI assistant** — a floating chatbot with typing indicator, quick
  replies and persisted history. Its `ai-service.js` is provider-shaped so a real
  OpenAI/Anthropic backend can be dropped in without redesigning the interface.
- **Command-palette search** (⌘/Ctrl-K) with fuzzy matching and recents.
- **Dark / light theme** with system detection, manual toggle and no flash.
- **Personalization** via `localStorage` — favorites, recents, history, to-dos,
  habits and theme.
- **Self-contained QR generator** — a from-scratch Reed–Solomon QR encoder
  (versions 1–10, all masks), verified to decode correctly.
- **Accessible & SEO-ready** — semantic HTML, ARIA, keyboard nav, per-route
  meta tags and FAQ structured data (JSON-LD).

## Run locally

ES modules require a server (not `file://`). A tiny zero-dependency server is
included:

```bash
node server.mjs        # serves at http://localhost:4173
```

Or use any static server (`npx serve`, `python3 -m http.server`, etc.).

## Project structure

```
index.html                  App shell (SEO meta, anti-FOUC theme, splash)
css/
  design-system.css         Tokens: color, type, spacing, shadow, motion + reset
  components.css             Buttons, cards, forms, navbar, search, modal, toast, assistant
  layout.css                Hero, homepage sections, tool pages, footer, responsive
js/
  app.js                    Bootstrap — wires theme, router, nav, search, assistant
  core/                     registry, router, store (localStorage), theme, seo
  services/ai-service.js    Assistant intent engine + future API integration point
  components/               navbar, search, assistant, footer, toast, modal
  ui/                       home, views, widgets, shared components
  tools/                    finance, health, productivity, developer, conversion
  utils/                    dom, format, icons, qrcode
```

## Accounts, subscriptions & premium (prototype)

A client-side prototype of auth + a €10/month/user Premium plan. The layers are
kept strictly separate so the fake pieces can be replaced by a real backend
without touching the UI:

```
auth.js          accounts & session (localStorage; SHA-256 hashing)
subscription.js  plan/status/dates + price math (10 €/seat)
payment.js       PaymentProvider interface → MockPaymentProvider today,
                 StripeProvider tomorrow (swap ONE export line)
access.js        accessLevel(tool) → AVAILABLE | PREMIUM  (category-based)
```

Access is enforced at three levels: card badges (UI), the tool route renders a
paywall instead of the tool (navigation), and the tool's `mount()` is never
called while locked (logic).

**Which tools are free vs premium is configured PER-FEATURE** in one editable
table — `js/config/features.js` — mapping each tool id to `"free"` or
`"premium"` (default split: 15 free / 20 premium). There is no category rule:
flip any single tool by changing one word; a tool not listed defaults to free.
`access.js` (`isPremiumTool`) is the only reader, so the config stays central.

⚠️ Being 100% front-end, this is **not tamper-proof** — real security requires a
backend. To go live: implement `StripeProvider.checkout()` in `payment.js`, and
back `auth.js` / `subscription.js` with API calls + webhooks.

## Adding a new tool

Register it from any file imported in `app.js`:

```js
import { register } from "../core/registry.js";

register({
  id: "my-tool",
  category: "productivity",
  icon: "✨",
  name: "My Tool",
  tagline: "What it does in one line.",
  keywords: ["..."],
  about: "SEO paragraph.",
  steps: ["..."], tips: ["..."], faqs: [{ q: "...", a: "..." }],
  mount(root, ctx) { /* render the interactive tool into root */ },
});
```

It automatically appears in search, navigation, the homepage grid, related-tool
lists and the AI assistant's recommendations.
