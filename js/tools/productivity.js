/**
 * Productivity tools — word/character counter, reading time, password
 * generator, random name generator, QR code, Pomodoro timer, to-do list.
 */
import { register } from "../core/registry.js";
import { h } from "../utils/dom.js";
import { num, fromMinutes } from "../utils/format.js";
import { store } from "../core/store.js";
import { icon } from "../utils/icons.js";
import { toast } from "../components/toast.js";
import {
  field, selectField, rangeField, textareaField, resultCard, resultHero,
  statGrid, copyButton, downloadButton, val, numval,
} from "../ui/widgets.js";
import { generateQR, drawQR } from "../utils/qrcode.js";

/* ---------------- Word / character counter ---------------- */
register({
  id: "word-counter", category: "productivity", icon: "🔤", featured: true,
  name: "Word & Character Counter",
  tagline: "Live counts for words, characters & reading time.",
  keywords: ["word count", "character counter", "letters", "text", "reading time"],
  about: "Paste any text to instantly count words, characters, sentences and paragraphs, plus estimated reading and speaking time. Everything runs locally as you type.",
  steps: ["Paste or type your text", "Watch the counts update live", "Use it to hit essay, tweet or SEO limits"],
  tips: ["Twitter/X posts cap at 280 characters; meta descriptions around 155.", "Average reading speed is ~230 words per minute."],
  faqs: [{ q: "Are spaces counted?", a: "You get both figures — total characters and characters excluding spaces." }],
  mount(root) {
    const ta = textareaField({ label: "Your text", placeholder: "Start typing or paste your text here…", rows: 8 });
    ta._input.style.minHeight = "200px";
    const out = h("div");
    function calc() {
      const t = val(ta);
      const words = (t.trim().match(/\S+/g) || []).length;
      const chars = t.length;
      const noSpace = t.replace(/\s/g, "").length;
      const sentences = (t.match(/[.!?]+(\s|$)/g) || []).length;
      const paras = (t.split(/\n+/).filter((p) => p.trim()).length);
      const readMin = words / 230, speakMin = words / 130;
      out.replaceChildren(resultCard([
        statGrid([
          { label: "Words", value: num(words) },
          { label: "Characters", value: num(chars) },
          { label: "No spaces", value: num(noSpace) },
          { label: "Sentences", value: num(sentences) },
          { label: "Paragraphs", value: num(paras) },
          { label: "Reading time", value: readMin < 1 ? "< 1 min" : fromMinutes(readMin) },
          { label: "Speaking time", value: speakMin < 1 ? "< 1 min" : fromMinutes(speakMin) },
        ]),
      ]));
    }
    ta._input.addEventListener("input", calc);
    root.append(ta, out);
    calc();
  },
});

/* ---------------- Password generator ---------------- */
register({
  id: "password", category: "productivity", icon: "🔐", featured: true,
  name: "Password Generator",
  tagline: "Strong, random passwords with a strength meter.",
  keywords: ["password", "generator", "secure", "random", "strength"],
  about: "Generate cryptographically random passwords using the Web Crypto API. Tune the length and character sets, and see a live strength estimate.",
  steps: ["Choose a length", "Toggle character types", "Copy your new password"],
  tips: ["Longer beats complex — 16+ characters is a strong baseline.", "Use a unique password per site and store them in a password manager."],
  faqs: [{ q: "Is it really random?", a: "Yes — it uses crypto.getRandomValues, the browser's cryptographically secure random source. Nothing leaves your device." }],
  mount(root) {
    const len = rangeField({ label: "Length", min: 6, max: 48, step: 1, value: 18, format: (v) => `${v} chars`, onInput: gen });
    const opts = { lower: true, upper: true, digits: true, symbols: true };
    const toggles = h("div", { style: { display: "grid", gap: ".5rem", gridTemplateColumns: "1fr 1fr" } });
    const defs = [["lower", "Lowercase a-z"], ["upper", "Uppercase A-Z"], ["digits", "Numbers 0-9"], ["symbols", "Symbols !@#$"]];
    for (const [key, label] of defs) {
      const cb = h("input", { type: "checkbox", checked: opts[key] });
      cb.addEventListener("change", () => { opts[key] = cb.checked; gen(); });
      toggles.append(h("label", { class: "chip", style: { justifyContent: "flex-start" } }, cb, label));
    }
    const output = h("div", { class: "output-block", style: { fontSize: "var(--fs-lg)", textAlign: "center", wordBreak: "break-all" } });
    const meter = h("div", { style: { height: "8px", borderRadius: "999px", background: "var(--bg-sunken)", overflow: "hidden", margin: "1rem 0 .5rem" } },
      h("div", { style: { height: "100%", width: "0%", transition: "width .3s, background .3s" } }));
    const meterLabel = h("div", { class: "field__hint", style: { textAlign: "center" } });
    let current = "";
    function gen() {
      const sets = [];
      if (opts.lower) sets.push("abcdefghijkmnopqrstuvwxyz");
      if (opts.upper) sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
      if (opts.digits) sets.push("23456789");
      if (opts.symbols) sets.push("!@#$%^&*-_=+?");
      if (!sets.length) { output.textContent = "Select at least one type"; return; }
      const all = sets.join("");
      const n = numval(len);
      const bytes = new Uint32Array(n);
      crypto.getRandomValues(bytes);
      let pw = "";
      // guarantee at least one from each selected set
      for (let i = 0; i < n; i++) pw += all[bytes[i] % all.length];
      let arr = pw.split("");
      sets.forEach((set, i) => { arr[i] = set[bytes[i] % set.length]; });
      // shuffle guaranteed chars
      for (let i = arr.length - 1; i > 0; i--) { const j = bytes[i] % (i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      current = arr.join("");
      output.textContent = current;
      score();
    }
    function score() {
      const pool = (opts.lower ? 25 : 0) + (opts.upper ? 24 : 0) + (opts.digits ? 8 : 0) + (opts.symbols ? 13 : 0);
      const entropy = current.length * Math.log2(pool || 2);
      const pct = Math.min(100, (entropy / 100) * 100);
      const bar = meter.firstChild;
      bar.style.width = `${pct}%`;
      let label, color;
      if (entropy < 40) { label = "Weak"; color = "var(--danger)"; }
      else if (entropy < 60) { label = "Fair"; color = "var(--warning)"; }
      else if (entropy < 90) { label = "Strong"; color = "var(--success)"; }
      else { label = "Very strong"; color = "var(--emerald-500)"; }
      bar.style.background = color;
      meterLabel.innerHTML = `<b style="color:${color}">${label}</b> · ~${Math.round(entropy)} bits of entropy`;
    }
    const actions = h("div", { style: { display: "flex", gap: ".5rem", justifyContent: "center", marginTop: "1rem" } },
      h("button", { class: "btn btn--primary", html: `${icon("refresh")} Regenerate`, onclick: gen }),
      copyButton(() => current, "Copy"));
    root.append(len, h("div", { style: { height: ".75rem" } }), toggles, output, meter, meterLabel, actions);
    gen();
  },
});

/* ---------------- Random name generator ---------------- */
register({
  id: "name-generator", category: "productivity", icon: "🎲",
  name: "Random Name Generator",
  tagline: "Names for people, projects, brands & usernames.",
  keywords: ["name", "generator", "random", "username", "brand", "project"],
  about: "Spin up random names for characters, startups, projects or usernames. Pick a style and generate as many as you need.",
  steps: ["Choose a name style", "Set how many to generate", "Copy the ones you like"],
  tips: ["Check domain and social handle availability before committing to a brand name."],
  faqs: [{ q: "Are these unique?", a: "They're randomly combined from curated word lists, so combinations are effectively unique but not guaranteed trademark-free." }],
  mount(root) {
    const FIRST = ["Alex","Sam","Jordan","Taylor","Riley","Morgan","Casey","Jamie","Noa","Kai","Luna","Milo","Nova","Eli","Aria","Finn","Zoe","Leo","Maya","Ivy"];
    const LAST = ["Stone","Frost","Vale","Reed","Hart","Wolfe","Lane","Cruz","Fox","Blake","Rivers","Sky","North","Quinn","Ash","Wren","Sage","Bloom","Vega","Cole"];
    const ADJ = ["Swift","Bright","Bold","Nova","Prime","Hyper","Lumen","Vivid","Zen","Quantum","Nimbus","Echo","Pixel","Cosmic","Turbo","Lucid","Aero","Ember","Flux","Onyx"];
    const NOUN = ["Labs","Works","Forge","Hub","Loop","Grid","Wave","Craft","Peak","Nest","Byte","Spark","Path","Core","Studio","Flow","Mint","Pulse","Yard","Base"];
    const style = selectField({ label: "Style", options: [
      { value: "person", label: "Person name" }, { value: "brand", label: "Brand / startup" },
      { value: "username", label: "Username" }, { value: "project", label: "Project codename" },
    ]});
    const count = rangeField({ label: "How many", min: 1, max: 12, step: 1, value: 6, format: (v) => `${v}`, onInput: gen });
    const list = h("div", { style: { display: "grid", gap: ".5rem", marginTop: "1.5rem" } });
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    function one(s) {
      switch (s) {
        case "person": return `${pick(FIRST)} ${pick(LAST)}`;
        case "brand": return `${pick(ADJ)}${pick(NOUN)}`;
        case "username": return `${pick(ADJ).toLowerCase()}_${pick(NOUN).toLowerCase()}${Math.floor(Math.random() * 90 + 10)}`;
        case "project": return `Project ${pick(ADJ)} ${pick(LAST)}`;
      }
    }
    function gen() {
      list.innerHTML = "";
      for (let i = 0; i < numval(count); i++) {
        const name = one(style._input.value);
        list.append(h("div", { class: "result-stat", style: { display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" } },
          h("b", {}, name), copyButton(() => name, "")));
      }
    }
    style._input.addEventListener("change", gen);
    root.append(selectRow(style), count,
      h("button", { class: "btn btn--primary", style: { marginTop: "1rem" }, html: `${icon("refresh")} Generate`, onclick: gen }),
      list);
    gen();
  },
});

/* ---------------- QR code generator ---------------- */
register({
  id: "qr-code", category: "productivity", icon: "📱", featured: true,
  name: "QR Code Generator",
  tagline: "Turn any link or text into a QR code.",
  keywords: ["qr", "qr code", "generator", "scan", "link"],
  about: "Create a scannable QR code for a URL, text, Wi-Fi login or contact. Everything is generated locally in your browser — download it as a PNG.",
  steps: ["Type or paste your link/text", "Adjust size and colors", "Download the PNG"],
  tips: ["Keep URLs short so the code stays easy to scan.", "Maintain high contrast — dark code on a light background scans best."],
  faqs: [{ q: "Is there a length limit?", a: "This generator supports up to roughly 150 characters (QR versions 1–10). Shorten long links with a URL shortener." }],
  mount(root) {
    const text = textareaField({ label: "Content", placeholder: "https://example.com", rows: 3 });
    text._input.value = "https://lifetools.app";
    const size = rangeField({ label: "Size", min: 4, max: 14, step: 1, value: 9, format: (v) => `${v * 40}px`, onInput: gen });
    const darkC = field({ label: "Foreground", type: "color", value: "#0a0c14" });
    const lightC = field({ label: "Background", type: "color", value: "#ffffff" });
    const canvas = h("canvas", { style: { maxWidth: "260px", width: "100%", borderRadius: "12px", boxShadow: "var(--sh-md)" } });
    const errBox = h("div", { class: "field__error", style: { textAlign: "center" } });
    const wrap = h("div", { style: { display: "grid", placeItems: "center", padding: "1.5rem", background: "var(--bg-sunken)", borderRadius: "16px", marginTop: "1rem" } }, canvas);
    function gen() {
      errBox.textContent = "";
      try {
        const m = generateQR(text._input.value || " ", { level: "M" });
        drawQR(m, canvas, { scale: numval(size), dark: darkC._input.value, light: lightC._input.value });
      } catch (e) {
        errBox.textContent = e.message;
      }
    }
    [text, darkC, lightC].forEach((f) => f._input.addEventListener("input", gen));
    const dl = h("button", { class: "btn btn--primary", html: `${icon("download")} Download PNG`, onclick: () => {
      canvas.toBlob((blob) => {
        const a = h("a", { href: URL.createObjectURL(blob), download: "qrcode.png" });
        a.click(); toast("QR code downloaded", "success");
      });
    }});
    root.append(text, h("div", { class: "tool-panel__grid cols-2", style: { marginTop: ".75rem" } }, darkC, lightC), size, wrap, errBox,
      h("div", { style: { textAlign: "center", marginTop: "1rem" } }, dl));
    gen();
  },
});

/* ---------------- Pomodoro timer ---------------- */
register({
  id: "pomodoro", category: "productivity", icon: "🍅",
  name: "Pomodoro Timer",
  tagline: "Focus in 25-minute sprints with breaks.",
  keywords: ["pomodoro", "timer", "focus", "productivity", "study"],
  about: "The Pomodoro Technique breaks work into focused 25-minute sprints separated by short breaks. After four sprints, take a longer break.",
  steps: ["Press start to begin a focus sprint", "Work until the timer rings", "Take the suggested break, then repeat"],
  tips: ["Silence notifications during a sprint — the point is uninterrupted focus.", "Use breaks to stand up and rest your eyes, not to check email."],
  faqs: [{ q: "Why 25 minutes?", a: "It's long enough for deep work but short enough to stay fresh and beat procrastination. Adjust it to what works for you." }],
  mount(root) {
    let mode = "focus", remaining = 25 * 60, timer = null, sessions = 0;
    const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
    const labels = { focus: "Focus", short: "Short break", long: "Long break" };
    const ring = h("div", { style: {
      width: "220px", height: "220px", borderRadius: "50%", display: "grid", placeItems: "center",
      margin: "1rem auto", position: "relative",
    }});
    const display = h("div", { style: { fontSize: "3rem", fontWeight: "800", letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" } });
    const modeLabel = h("div", { class: "eyebrow", style: { justifyContent: "center" } }, labels[mode]);
    ring.append(h("div", { style: { textAlign: "center" } }, display, modeLabel));
    function fmt(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
    function paint() {
      display.textContent = fmt(remaining);
      modeLabel.textContent = labels[mode];
      const pct = (1 - remaining / durations[mode]) * 360;
      const color = mode === "focus" ? "var(--brand-500)" : "var(--emerald-500)";
      ring.style.background = `conic-gradient(${color} ${pct}deg, var(--bg-sunken) ${pct}deg)`;
      ring.style.padding = "14px";
    }
    const shell = h("div", { style: { background: "var(--bg-elev)", borderRadius: "50%" } });
    function tick() {
      remaining--;
      if (remaining < 0) { switchMode(); return; }
      paint();
    }
    function switchMode() {
      clearInterval(timer); timer = null;
      if (mode === "focus") { sessions++; mode = sessions % 4 === 0 ? "long" : "short"; toast("Sprint done! Take a break ☕", "success"); }
      else { mode = "focus"; toast("Break over — back to focus 💪", "info"); }
      remaining = durations[mode];
      paint(); updateBtn();
      try { new Audio("data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YS4AAAB/f39/f39/f4CAgICAgICAf39/f39/f3+AgICAgICAgH9/f39/f39/gA==").play(); } catch {}
    }
    const startBtn = h("button", { class: "btn btn--primary btn--lg" });
    const resetBtn = h("button", { class: "btn btn--ghost", html: `${icon("refresh")} Reset` });
    function updateBtn() { startBtn.textContent = timer ? "⏸ Pause" : "▶ Start"; }
    startBtn.addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; }
      else { timer = setInterval(tick, 1000); }
      updateBtn();
    });
    resetBtn.addEventListener("click", () => { clearInterval(timer); timer = null; remaining = durations[mode]; paint(); updateBtn(); });
    const modeBtns = h("div", { class: "segmented", style: { display: "flex", justifyContent: "center", margin: "0 auto 1rem", width: "fit-content" } });
    for (const key of ["focus", "short", "long"]) {
      modeBtns.append(h("button", { class: key === mode ? "is-active" : "", onclick: () => {
        clearInterval(timer); timer = null; mode = key; remaining = durations[key];
        [...modeBtns.children].forEach((b, i) => b.classList.toggle("is-active", ["focus","short","long"][i] === key));
        paint(); updateBtn();
      } }, labels[key]));
    }
    // cleanup on navigation
    root.addEventListener("tool:unmount", () => clearInterval(timer));
    shell.append(ring);
    root.append(modeBtns, shell, h("div", { style: { display: "flex", gap: ".75rem", justifyContent: "center", marginTop: "1.5rem" } }, startBtn, resetBtn));
    paint(); updateBtn();
  },
});

/* ---------------- To-do list ---------------- */
register({
  id: "todo", category: "productivity", icon: "📝", featured: true,
  name: "To-Do List Manager",
  tagline: "A fast, private to-do list saved on your device.",
  keywords: ["todo", "task", "list", "checklist", "planner"],
  about: "A clean, distraction-free to-do list. Add tasks, mark them done, reorder your day — all stored locally in your browser.",
  steps: ["Type a task and press Enter", "Tick tasks off as you finish", "Clear completed when you're done"],
  tips: ["Keep your list to 3–5 priorities to stay focused.", "Phrase tasks as actions: 'Email the report', not 'report'."],
  faqs: [{ q: "Where is my list stored?", a: "Entirely in your browser's local storage. It's private to this device and never uploaded." }],
  mount(root) {
    const input = field({ placeholder: "Add a task and press Enter…", type: "text" });
    const list = h("div", { style: { display: "grid", gap: ".5rem", marginTop: "1.5rem" } });
    const foot = h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" } });
    function render() {
      const todos = store.get("todos");
      list.innerHTML = "";
      if (!todos.length) { list.append(h("div", { class: "empty-state" }, h("div", { class: "empty-state__icon" }, "🎯"), "Nothing here yet — add your first task.")); }
      for (const t of todos) {
        const row = h("div", { class: "result-stat", style: { display: "flex", alignItems: "center", gap: ".75rem", textAlign: "left", opacity: t.done ? ".55" : "1" } },
          h("button", { class: `fav-btn ${t.done ? "is-fav" : ""}`, style: { background: t.done ? "var(--emerald-500)" : "var(--bg-sunken)", color: t.done ? "#fff" : "var(--text-faint)" }, html: t.done ? icon("check") : "", onclick: () => toggle(t.id) }),
          h("span", { style: { flex: "1", textDecoration: t.done ? "line-through" : "none" } }, t.text),
          h("button", { class: "fav-btn", html: icon("trash"), onclick: () => remove(t.id) }));
        list.append(row);
      }
      const done = todos.filter((t) => t.done).length;
      foot.innerHTML = "";
      foot.append(
        h("span", { class: "field__hint" }, `${todos.length - done} left · ${done} done`),
        done ? h("button", { class: "copy-btn", html: `${icon("trash")} Clear completed`, onclick: clearDone }) : h("span"));
    }
    function add() {
      const text = input._input.value.trim(); if (!text) return;
      store.update("todos", (ts) => [{ id: Date.now().toString(36), text, done: false }, ...ts]);
      input._input.value = ""; render();
    }
    function toggle(id) { store.update("todos", (ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t)); render(); }
    function remove(id) { store.update("todos", (ts) => ts.filter((t) => t.id !== id)); render(); }
    function clearDone() { store.update("todos", (ts) => ts.filter((t) => !t.done)); render(); }
    input._input.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    root.append(input, list, foot);
    render();
  },
});

function selectRow(...f) { return h("div", { class: "tool-panel__grid" }, ...f); }
