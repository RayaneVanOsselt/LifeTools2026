/**
 * LifeTools — application bootstrap.
 * Wires together i18n, theme, registry (via tool imports), navigation, routing,
 * search, the AI assistant, and the footer.
 */
import { theme } from "./core/theme.js";
import { initI18n, onLocaleChange } from "./core/i18n.js";
import { route, startRouter, setNotFound, setOnNavigate, resolve } from "./core/router.js";
import { initNavbar } from "./components/navbar.js";
import { initSearch } from "./components/search.js";
import { initAssistant } from "./components/assistant.js";
import { buildFooter } from "./components/footer.js";
import { renderHome } from "./ui/home.js";
import {
  renderTool, renderAllTools, renderCategory, renderFavorites, renderNotFound,
} from "./ui/views.js";

// Register the available locales (order defines the switcher order).
import "./i18n/en.js";
import "./i18n/fr.js";
import "./i18n/nl.js";

// Importing the tool modules registers every tool with the registry.
import "./tools/finance.js";
import "./tools/health.js";
import "./tools/productivity.js";
import "./tools/developer.js";
import "./tools/conversion.js";

function boot() {
  initI18n();
  theme.init();

  const app = document.getElementById("app");
  const view = document.createElement("main");
  view.className = "app-main";
  view.id = "view";
  app.append(view);

  const search = initSearch();
  const nav = initNavbar({ openSearch: search.open });
  initAssistant();

  // Routes
  route("/", () => renderHome(view));
  route("/tools", () => renderAllTools(view));
  route("/category/:id", ({ id }) => renderCategory(view, id));
  route("/tool/:id", ({ id }) => renderTool(view, id));
  route("/favorites", () => renderFavorites(view));
  setNotFound(() => renderNotFound(view));
  setOnNavigate((path) => nav.setActive(path));

  let footerEl = buildFooter();
  view.after(footerEl);

  startRouter();

  // Re-render everything when the language changes.
  onLocaleChange(() => {
    nav.refresh();
    window.LifeToolsAssistant?.refresh();
    const nf = buildFooter();
    footerEl.replaceWith(nf);
    footerEl = nf;
    resolve();            // re-render the current view in the new language
    nav.setActive(location.hash.slice(1) || "/");
  });

  window.dispatchEvent(new Event("scroll"));
  document.getElementById("splash")?.classList.add("is-hidden");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
