/**
 * AI Assistant — floating chatbot with typing indicator, timestamps,
 * quick suggestions, and persisted conversation history.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { ask } from "../services/ai-service.js";
import { navigate } from "../core/router.js";
import { t, intlLocale } from "../core/i18n.js";

const HISTORY_KEY = "lifetools:chat";

export function initAssistant() {
  const fab = h("button", {
    class: "assistant-fab", "aria-label": t("assistant.open"),
    html: `<span class="assistant-fab__pulse">${icon("sparkle")}</span><span class="assistant-fab__label">${t("assistant.open")}</span>`,
  });

  const body = h("div", { class: "assistant-body", id: "assistant-body" });
  const suggestions = h("div", { class: "assistant-suggestions" });
  const input = h("input", { type: "text", placeholder: t("assistant.placeholder"), "aria-label": t("assistant.placeholder") });
  const sendBtn = h("button", { "aria-label": "Send", html: icon("send") });

  const headTitle = h("div", { class: "assistant-head__title" }, t("assistant.title"));
  const headStatus = h("div", { class: "assistant-head__status" }, t("assistant.status"));

  const panel = h("div", { class: "assistant-panel", role: "dialog", "aria-label": t("assistant.title") },
    h("div", { class: "assistant-head" },
      h("div", { class: "assistant-head__avatar", html: icon("bot") }),
      h("div", {}, headTitle, headStatus),
      h("button", { "aria-label": "Close", html: icon("close"), onclick: close })),
    body, suggestions,
    h("div", { class: "assistant-input" }, input, sendBtn),
  );

  document.body.append(fab, panel);

  let history = load();

  function open() {
    panel.classList.add("is-open");
    fab.classList.add("is-hidden");
    if (!history.length) greet();
    else render();
    setTimeout(() => input.focus(), 320);
  }
  function close() { panel.classList.remove("is-open"); fab.classList.remove("is-hidden"); }
  fab.addEventListener("click", open);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  function greet() {
    addBot(t("assistant.greeting"));
    renderSuggestions(t("assistant.quickPrompts"));
  }

  function renderSuggestions(list) {
    suggestions.innerHTML = "";
    for (const s of list) suggestions.append(h("button", { onclick: () => submit(s) }, s));
  }

  function time() { return new Date().toLocaleTimeString(intlLocale(), { hour: "2-digit", minute: "2-digit" }); }

  function addUser(text) { history.push({ role: "user", text, ts: Date.now() }); save(); appendMessage("user", text); }
  function addBot(text, actions) { history.push({ role: "bot", text, ts: Date.now() }); save(); appendMessage("bot", text, actions); }

  function appendMessage(role, text, actions) {
    const bubble = h("div", { class: "msg__bubble" });
    bubble.innerHTML = text;
    bubble.querySelectorAll("a[data-tool]").forEach((a) => {
      a.addEventListener("click", (e) => { e.preventDefault(); navigate(`/tool/${a.dataset.tool}`); close(); });
    });
    const wrap = h("div", { class: `msg msg--${role}` },
      h("div", {}, bubble, h("div", { class: "msg__time" }, time())));
    if (actions?.length) {
      const row = h("div", { style: { display: "flex", gap: ".4rem", flexWrap: "wrap", marginTop: ".4rem" } });
      for (const a of actions) {
        row.append(h("div", { class: "assistant-suggestions", style: { padding: 0 } },
          h("button", { onclick: () => runAction(a) }, a.label)));
      }
      wrap.firstChild.append(row);
    }
    body.append(wrap);
    body.scrollTop = body.scrollHeight;
  }

  function runAction(a) {
    if (a.toolId === "__browse") navigate("/tools");
    else navigate(`/tool/${a.toolId}`);
    close();
  }

  function showTyping() {
    const el = h("div", { class: "msg msg--bot", id: "typing" }, h("div", { class: "typing" }, h("span"), h("span"), h("span")));
    body.append(el); body.scrollTop = body.scrollHeight;
    return () => el.remove();
  }

  async function submit(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = "";
    suggestions.innerHTML = "";
    addUser(text);
    const stop = showTyping();
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    let res;
    try { res = await ask(text, { history }); }
    catch { res = { text: t("assistant.error") }; }
    stop();
    addBot(res.text, res.actions);
  }

  sendBtn.addEventListener("click", () => submit());
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

  function render() {
    body.innerHTML = "";
    for (const m of history) appendMessage(m.role, m.text);
  }
  function save() { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40))); } catch {} }
  function load() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } }

  /** Re-localize the assistant chrome after a language change. */
  function refresh() {
    fab.querySelector(".assistant-fab__label").textContent = t("assistant.open");
    fab.setAttribute("aria-label", t("assistant.open"));
    headTitle.textContent = t("assistant.title");
    headStatus.textContent = t("assistant.status");
    input.placeholder = t("assistant.placeholder");
    if (suggestions.children.length && !history.length) renderSuggestions(t("assistant.quickPrompts"));
  }

  window.LifeToolsAssistant = {
    open, close, refresh,
    askAbout(toolName) { open(); setTimeout(() => submit(t("assistant.aboutPrompt", { name: toolName })), 350); },
  };
}
