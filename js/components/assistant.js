/**
 * AI Assistant — floating chatbot with typing indicator, timestamps,
 * quick suggestions, and persisted conversation history.
 */
import { h, qs } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { ask, QUICK_PROMPTS } from "../services/ai-service.js";
import { navigate } from "../core/router.js";

const HISTORY_KEY = "lifetools:chat";

export function initAssistant() {
  const fab = h("button", {
    class: "assistant-fab", "aria-label": "Open LifeTools assistant",
    html: `<span class="assistant-fab__pulse">${icon("sparkle")}</span><span class="assistant-fab__label">Ask AI</span>`,
  });

  const body = h("div", { class: "assistant-body", id: "assistant-body" });
  const suggestions = h("div", { class: "assistant-suggestions" });
  const input = h("input", { type: "text", placeholder: "Ask me anything…", "aria-label": "Message the assistant" });
  const sendBtn = h("button", { "aria-label": "Send", html: icon("send") });

  const panel = h("div", { class: "assistant-panel", role: "dialog", "aria-label": "LifeTools assistant" },
    h("div", { class: "assistant-head" },
      h("div", { class: "assistant-head__avatar", html: icon("bot") }),
      h("div", {},
        h("div", { class: "assistant-head__title" }, "LifeTools Assistant"),
        h("div", { class: "assistant-head__status" }, "Online · here to help")),
      h("button", { "aria-label": "Close assistant", html: icon("close"), onclick: close })),
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
    addBot("👋 Hi! I'm your LifeTools assistant. I can help you find the right tool, explain calculations, or guide you around the platform. What are you working on?");
    renderSuggestions(QUICK_PROMPTS);
  }

  function renderSuggestions(list) {
    suggestions.innerHTML = "";
    for (const s of list) suggestions.append(h("button", { onclick: () => submit(s) }, s));
  }

  function time() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  function addUser(text) {
    history.push({ role: "user", text, ts: Date.now() });
    save(); appendMessage("user", text);
  }
  function addBot(text, actions) {
    history.push({ role: "bot", text, ts: Date.now() });
    save(); appendMessage("bot", text, actions);
  }

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
        row.append(h("button", { class: "assistant-suggestions", style: { padding: 0 } },
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
    const t = h("div", { class: "msg msg--bot", id: "typing" }, h("div", { class: "typing" }, h("span"), h("span"), h("span")));
    body.append(t); body.scrollTop = body.scrollHeight;
    return () => t.remove();
  }

  async function submit(text) {
    text = (text || input.value).trim();
    if (!text) return;
    input.value = "";
    suggestions.innerHTML = "";
    addUser(text);
    const stop = showTyping();
    // realistic small delay
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    let res;
    try { res = await ask(text, { history }); }
    catch { res = { text: "Sorry, something went wrong. Please try again." }; }
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

  // Public hook so other UI (e.g. "Ask AI about this tool") can open + prefill.
  window.LifeToolsAssistant = {
    open, close,
    askAbout(toolName) { open(); setTimeout(() => submit(`Tell me about the ${toolName}`), 350); },
  };
}
