/**
 * LifeTools — application bootstrap.
 * Wires together theme, registry (via tool imports), navigation, routing,
 * search, the AI assistant, and the footer.
 */
import { theme } from "./core/theme.js";
import { route, startRouter, setNotFound, setOnNavigate } from "./core/router.js";
import { initNavbar } from "./components/navbar.js";
import { initSearch } from "./components/search.js";
import { initAssistant } from "./components/assistant.js";
import { buildFooter } from "./components/footer.js";
import { renderHome } from "./ui/home.js";
import {
  renderTool, renderAllTools, renderCategory, renderFavorites, renderNotFound,
} from "./ui/views.js";

// Importing the tool modules registers every tool with the registry.
import "./tools/finance.js";
import "./tools/health.js";
import "./tools/productivity.js";
import "./tools/developer.js";
import "./tools/conversion.js";

function boot() {
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
  route("/", (_, r = view) => renderHome(view));
  route("/tools", () => renderAllTools(view));
  route("/category/:id", ({ id }) => renderCategory(view, id));
  route("/tool/:id", ({ id }) => renderTool(view, id));
  route("/favorites", () => renderFavorites(view));
  setNotFound(() => renderNotFound(view));
  setOnNavigate((path) => nav.setActive(path));

  view.after(buildFooter());

  startRouter();

  // Reveal footer/newsletter etc. as they enter
  window.dispatchEvent(new Event("scroll"));

  // Loading splash out
  document.getElementById("splash")?.classList.add("is-hidden");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
