/**
 * Developer & designer tools — gradient, box-shadow, border-radius, JSON
 * formatter, HTML encode/decode, timestamp converter, Lorem Ipsum, color palette.
 */
import { register } from "../core/registry.js";
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { toast } from "../components/toast.js";
import {
  field, selectField, rangeField, textareaField, resultCard,
  copyButton, val, numval,
} from "../ui/widgets.js";

/* ---------------- Gradient generator ---------------- */
register({
  id: "gradient", category: "developer", icon: "🌈", featured: true,
  name: "Gradient Generator",
  tagline: "Design CSS gradients and copy the code.",
  keywords: ["gradient", "css", "background", "linear", "color"],
  about: "Visually build linear gradients, tweak the angle and color stops, and copy production-ready CSS.",
  steps: ["Pick two colors", "Adjust the angle", "Copy the generated CSS"],
  tips: ["Subtle gradients (close hues) feel more premium than rainbow blends."],
  faqs: [{ q: "Can I use these anywhere?", a: "Yes — the output is standard CSS you can paste into any stylesheet or inline style." }],
  mount(root) {
    const c1 = field({ label: "Color 1", type: "color", value: "#345ef4" });
    const c2 = field({ label: "Color 2", type: "color", value: "#8b5cf6" });
    const angle = rangeField({ label: "Angle", min: 0, max: 360, step: 1, value: 120, format: (v) => `${v}°`, onInput: paint });
    const preview = h("div", { style: { height: "180px", borderRadius: "16px", margin: "1rem 0", boxShadow: "var(--sh-md)" } });
    const code = h("div", { class: "output-block" });
    function css() { return `background: linear-gradient(${numval(angle)}deg, ${c1._input.value}, ${c2._input.value});`; }
    function paint() { preview.style.background = `linear-gradient(${numval(angle)}deg, ${c1._input.value}, ${c2._input.value})`; code.textContent = css(); }
    [c1, c2].forEach((f) => f._input.addEventListener("input", paint));
    root.append(h("div", { class: "tool-panel__grid cols-2" }, c1, c2), angle, preview, code,
      h("div", { style: { marginTop: ".75rem" } }, copyButton(css, "Copy CSS")));
    paint();
  },
});

/* ---------------- Box-shadow generator ---------------- */
register({
  id: "box-shadow", category: "developer", icon: "🌑",
  name: "CSS Shadow Generator",
  tagline: "Craft box-shadows with a live preview.",
  keywords: ["shadow", "box-shadow", "css", "elevation"],
  about: "Dial in a CSS box-shadow — offset, blur, spread, color and opacity — and copy the result.",
  steps: ["Adjust the sliders", "Watch the preview update", "Copy the CSS"],
  tips: ["Layer two shadows (a tight one + a soft one) for realistic depth."],
  faqs: [{ q: "How do I add an inner shadow?", a: "Prefix the value with 'inset'. You can adapt the copied output by adding that keyword." }],
  mount(root) {
    const x = rangeField({ label: "Offset X", min: -50, max: 50, step: 1, value: 0, format: (v) => `${v}px`, onInput: paint });
    const y = rangeField({ label: "Offset Y", min: -50, max: 50, step: 1, value: 14, format: (v) => `${v}px`, onInput: paint });
    const blur = rangeField({ label: "Blur", min: 0, max: 100, step: 1, value: 40, format: (v) => `${v}px`, onInput: paint });
    const spread = rangeField({ label: "Spread", min: -30, max: 30, step: 1, value: -6, format: (v) => `${v}px`, onInput: paint });
    const color = field({ label: "Color", type: "color", value: "#10131c" });
    const opacity = rangeField({ label: "Opacity", min: 0, max: 100, step: 1, value: 18, format: (v) => `${v}%`, onInput: paint });
    const box = h("div", { style: { width: "120px", height: "120px", borderRadius: "20px", background: "var(--bg-elev)", margin: "2.5rem auto" } });
    const stage = h("div", { style: { padding: "1rem", background: "var(--bg-sunken)", borderRadius: "16px", margin: "1rem 0" } }, box);
    const code = h("div", { class: "output-block" });
    function rgba() {
      const hex = color._input.value;
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${(numval(opacity) / 100).toFixed(2)})`;
    }
    function css() { return `box-shadow: ${numval(x)}px ${numval(y)}px ${numval(blur)}px ${numval(spread)}px ${rgba()};`; }
    function paint() { box.style.boxShadow = css().replace("box-shadow: ", "").replace(";", ""); code.textContent = css(); }
    color._input.addEventListener("input", paint);
    root.append(h("div", { class: "tool-panel__grid cols-2" }, x, y, blur, spread), color, opacity, stage, code,
      h("div", { style: { marginTop: ".75rem" } }, copyButton(css, "Copy CSS")));
    paint();
  },
});

/* ---------------- Border-radius generator ---------------- */
register({
  id: "border-radius", category: "developer", icon: "⬜",
  name: "Border Radius Generator",
  tagline: "Design rounded corners, even organic blobs.",
  keywords: ["border radius", "rounded", "css", "corners", "blob"],
  about: "Independently control each corner radius to design cards, buttons or organic blob shapes, then copy the CSS.",
  steps: ["Adjust each corner", "Preview the shape", "Copy the CSS"],
  tips: ["Set very different horizontal/vertical values for trendy blob shapes."],
  faqs: [{ q: "What does the slash mean?", a: "In border-radius, values before the slash are horizontal radii and after are vertical, enabling elliptical corners." }],
  mount(root) {
    const tl = rangeField({ label: "Top-left", min: 0, max: 100, step: 1, value: 24, format: (v) => `${v}px`, onInput: paint });
    const tr = rangeField({ label: "Top-right", min: 0, max: 100, step: 1, value: 24, format: (v) => `${v}px`, onInput: paint });
    const br = rangeField({ label: "Bottom-right", min: 0, max: 100, step: 1, value: 24, format: (v) => `${v}px`, onInput: paint });
    const bl = rangeField({ label: "Bottom-left", min: 0, max: 100, step: 1, value: 24, format: (v) => `${v}px`, onInput: paint });
    const box = h("div", { style: { width: "140px", height: "140px", background: "linear-gradient(135deg,var(--brand-500),var(--violet-500))", margin: "1.5rem auto" } });
    const code = h("div", { class: "output-block" });
    function css() { return `border-radius: ${numval(tl)}px ${numval(tr)}px ${numval(br)}px ${numval(bl)}px;`; }
    function paint() { box.style.borderRadius = `${numval(tl)}px ${numval(tr)}px ${numval(br)}px ${numval(bl)}px`; code.textContent = css(); }
    root.append(h("div", { class: "tool-panel__grid cols-2" }, tl, tr, bl, br), box, code,
      h("div", { style: { marginTop: ".75rem" } }, copyButton(css, "Copy CSS")));
    paint();
  },
});

/* ---------------- Color palette generator ---------------- */
register({
  id: "color-palette", category: "developer", icon: "🎨", featured: true,
  name: "Color Palette Generator",
  tagline: "Generate harmonious palettes from a base color.",
  keywords: ["color", "palette", "scheme", "design", "hex"],
  about: "Pick a base color and a harmony rule to generate a coordinated palette. Copy any hex value with one click.",
  steps: ["Choose a base color", "Select a harmony (complementary, analogous…)", "Copy the hex codes"],
  tips: ["Use one dominant color, a couple of supporting tones, and one accent for contrast."],
  faqs: [{ q: "What's an analogous scheme?", a: "Colors next to each other on the wheel — they feel harmonious and calm. Complementary colors sit opposite for high contrast." }],
  mount(root) {
    const base = field({ label: "Base color", type: "color", value: "#345ef4" });
    const mode = selectField({ label: "Harmony", options: [
      { value: "complementary", label: "Complementary" }, { value: "analogous", label: "Analogous" },
      { value: "triadic", label: "Triadic" }, { value: "monochrome", label: "Monochrome" }, { value: "shades", label: "Shades" },
    ]});
    const swatches = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: ".5rem", marginTop: "1.5rem" } });
    const hexToHsl = (hex) => {
      let r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b); let hh, s, l = (max + min) / 2;
      if (max === min) { hh = s = 0; } else {
        const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6;
      }
      return [hh * 360, s * 100, l * 100];
    };
    const hslToHex = (hh, s, l) => {
      s /= 100; l /= 100; const k = (n) => (n + hh / 30) % 12; const a = s * Math.min(l, 1 - l);
      const f = (n) => { const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return Math.round(255 * c).toString(16).padStart(2, "0"); };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    function palette() {
      const [hh, s, l] = hexToHsl(base._input.value);
      switch (mode._input.value) {
        case "complementary": return [[hh, s, l], [(hh + 180) % 360, s, l], [(hh + 180) % 360, s, Math.min(90, l + 18)], [hh, s * 0.6, Math.min(92, l + 25)]];
        case "analogous": return [-40, -20, 0, 20, 40].map((d) => [(hh + d + 360) % 360, s, l]);
        case "triadic": return [[hh, s, l], [(hh + 120) % 360, s, l], [(hh + 240) % 360, s, l], [hh, s * 0.5, Math.min(90, l + 20)]];
        case "monochrome": return [0, 15, 30, 45, 60].map((d) => [hh, Math.max(10, s - d * 0.5), Math.min(92, l - 25 + d)]);
        case "shades": return [15, 32, 50, 68, 85].map((L) => [hh, s, L]);
      }
    }
    function render() {
      swatches.innerHTML = "";
      for (const [hh, s, l] of palette()) {
        const hex = hslToHex(hh, s, l).toUpperCase();
        const sw = h("button", { style: { height: "96px", borderRadius: "12px", background: hex, border: "1px solid var(--border)", display: "flex", alignItems: "flex-end", padding: ".5rem", cursor: "pointer", boxShadow: "var(--sh-xs)" }, title: `Copy ${hex}` },
          h("span", { style: { fontSize: ".7rem", fontWeight: "700", background: "rgba(255,255,255,.85)", color: "#111", padding: "2px 6px", borderRadius: "6px" } }, hex));
        sw.addEventListener("click", async () => { await navigator.clipboard.writeText(hex).catch(() => {}); toast(`Copied ${hex}`, "success", 1400); });
        swatches.append(sw);
      }
    }
    base._input.addEventListener("input", render);
    mode._input.addEventListener("change", render);
    root.append(h("div", { class: "tool-panel__grid cols-2" }, base, mode), swatches);
    render();
  },
});

/* ---------------- JSON formatter ---------------- */
register({
  id: "json-formatter", category: "developer", icon: "🧬", featured: true,
  name: "JSON Formatter",
  tagline: "Beautify, minify and validate JSON.",
  keywords: ["json", "format", "beautify", "minify", "validate", "pretty"],
  about: "Paste JSON to pretty-print it with proper indentation, or minify it to a single line. Errors are pinpointed so you can fix them fast.",
  steps: ["Paste your JSON", "Choose format or minify", "Copy the clean result"],
  tips: ["Minified JSON is smaller for transport; formatted JSON is easier to read."],
  faqs: [{ q: "Is my data sent anywhere?", a: "No — parsing and formatting happen entirely in your browser." }],
  mount(root) {
    const input = textareaField({ label: "Input JSON", placeholder: '{"hello":"world","items":[1,2,3]}', rows: 6 });
    input._input.value = '{"name":"LifeTools","tools":42,"features":["fast","free","private"]}';
    const output = h("div", { class: "output-block" });
    const status = h("div", { class: "field__hint" });
    function process(indent) {
      try {
        const obj = JSON.parse(input._input.value);
        output.textContent = JSON.stringify(obj, null, indent);
        status.innerHTML = `<span style="color:var(--success)">✓ Valid JSON</span>`;
        output.style.color = "var(--text)";
      } catch (e) {
        output.textContent = e.message;
        output.style.color = "var(--danger)";
        status.innerHTML = `<span style="color:var(--danger)">✗ Invalid JSON</span>`;
      }
    }
    input._input.addEventListener("input", () => process(2));
    root.append(input, status,
      h("div", { style: { display: "flex", gap: ".5rem", flexWrap: "wrap", margin: ".75rem 0" } },
        h("button", { class: "btn btn--primary btn--sm", html: "Beautify", onclick: () => process(2) }),
        h("button", { class: "btn btn--ghost btn--sm", html: "Minify", onclick: () => process(0) }),
        copyButton(() => output.textContent, "Copy")),
      output);
    process(2);
  },
});

/* ---------------- HTML encoder / decoder ---------------- */
register({
  id: "html-encode", category: "developer", icon: "🔣",
  name: "HTML Encoder / Decoder",
  tagline: "Escape or unescape HTML entities.",
  keywords: ["html", "encode", "decode", "entities", "escape"],
  about: "Convert special characters to HTML entities (and back) so text renders literally instead of as markup.",
  steps: ["Paste your text or HTML", "Choose encode or decode", "Copy the result"],
  tips: ["Always encode user-supplied text before injecting it into HTML to prevent XSS."],
  faqs: [{ q: "Which characters get encoded?", a: "The reserved ones: &, <, >, \" and '. These are the characters that change how a browser parses HTML." }],
  mount(root) {
    const input = textareaField({ label: "Input", placeholder: "<div class=\"box\">Hi & bye</div>", rows: 5 });
    input._input.value = '<a href="#">Tom & Jerry</a>';
    const output = h("div", { class: "output-block" });
    const enc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const dec = (s) => { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; };
    input._input.addEventListener("input", () => { output.textContent = enc(input._input.value); });
    root.append(input,
      h("div", { style: { display: "flex", gap: ".5rem", flexWrap: "wrap", margin: ".75rem 0" } },
        h("button", { class: "btn btn--primary btn--sm", html: "Encode →", onclick: () => output.textContent = enc(input._input.value) }),
        h("button", { class: "btn btn--ghost btn--sm", html: "← Decode", onclick: () => output.textContent = dec(input._input.value) }),
        copyButton(() => output.textContent, "Copy")),
      output);
    output.textContent = enc(input._input.value);
  },
});

/* ---------------- Timestamp converter ---------------- */
register({
  id: "timestamp", category: "developer", icon: "⏱️",
  name: "Timestamp Converter",
  tagline: "Unix time ↔ human-readable dates.",
  keywords: ["timestamp", "unix", "epoch", "date", "time", "convert"],
  about: "Convert between Unix timestamps (seconds or milliseconds) and human-readable dates in local and UTC time.",
  steps: ["Enter a Unix timestamp or a date", "Read the converted value in every format"],
  tips: ["Unix time counts seconds since Jan 1 1970 UTC. JavaScript uses milliseconds."],
  faqs: [{ q: "Seconds or milliseconds?", a: "The tool auto-detects: 10-digit values are treated as seconds, 13-digit as milliseconds." }],
  mount(root) {
    const ts = field({ label: "Unix timestamp", type: "number", value: Math.floor(Date.now() / 1000) });
    const date = field({ label: "Date & time", type: "datetime-local", value: new Date().toISOString().slice(0, 16) });
    const out = h("div");
    function fromTs() {
      let v = numval(ts); if (!isFinite(v)) return;
      if (String(Math.floor(v)).length <= 11) v *= 1000;
      const d = new Date(v);
      date._input.value = new Date(v - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      show(d);
    }
    function fromDate() { const d = new Date(date._input.value); if (isNaN(d)) return; ts._input.value = Math.floor(d.getTime() / 1000); show(d); }
    function show(d) {
      out.replaceChildren(resultCard([
        rowEl("Local", d.toLocaleString()),
        rowEl("UTC", d.toUTCString()),
        rowEl("ISO 8601", d.toISOString()),
        rowEl("Unix (s)", Math.floor(d.getTime() / 1000)),
        rowEl("Unix (ms)", d.getTime()),
      ]));
    }
    function rowEl(k, v) {
      return h("div", { class: "result-stat", style: { display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", marginBottom: ".4rem" } },
        h("span", { class: "result-stat__label" }, k), h("b", { style: { fontFamily: "var(--font-mono)", fontSize: ".85rem" } }, String(v)), copyButton(() => String(v), ""));
    }
    ts._input.addEventListener("input", fromTs);
    date._input.addEventListener("input", fromDate);
    root.append(h("div", { class: "tool-panel__grid cols-2" }, ts, date),
      h("button", { class: "btn btn--ghost btn--sm", style: { marginTop: ".75rem" }, html: `${icon("clock")} Now`, onclick: () => { ts._input.value = Math.floor(Date.now() / 1000); fromTs(); } }),
      out);
    fromTs();
  },
});

/* ---------------- Lorem Ipsum ---------------- */
register({
  id: "lorem", category: "developer", icon: "📄",
  name: "Lorem Ipsum Generator",
  tagline: "Placeholder text for mockups and layouts.",
  keywords: ["lorem", "ipsum", "placeholder", "dummy text", "filler"],
  about: "Generate classic Lorem Ipsum placeholder text by paragraphs, sentences or words — perfect for design mockups.",
  steps: ["Choose the unit and amount", "Generate", "Copy into your design"],
  tips: ["Real placeholder length affects layout — generate roughly the amount your final copy will need."],
  faqs: [{ q: "Why Lorem Ipsum?", a: "Its Latin-like words have a natural distribution of letter lengths, so layouts look realistic without readers focusing on the text." }],
  mount(root) {
    const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
    const unit = selectField({ label: "Unit", options: [{ value: "paragraphs", label: "Paragraphs" }, { value: "sentences", label: "Sentences" }, { value: "words", label: "Words" }] });
    const count = rangeField({ label: "Amount", min: 1, max: 20, step: 1, value: 3, format: (v) => `${v}`, onInput: gen });
    const output = h("div", { class: "output-block", style: { fontFamily: "var(--font-sans)", whiteSpace: "pre-wrap" } });
    const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const word = () => WORDS[rand(0, WORDS.length - 1)];
    const sentence = () => { let s = Array.from({ length: rand(6, 14) }, word).join(" "); return s[0].toUpperCase() + s.slice(1) + "."; };
    const para = () => Array.from({ length: rand(3, 6) }, sentence).join(" ");
    function gen() {
      const n = numval(count); let text = "";
      if (unit._input.value === "paragraphs") text = Array.from({ length: n }, para).join("\n\n");
      else if (unit._input.value === "sentences") text = Array.from({ length: n }, sentence).join(" ");
      else text = Array.from({ length: n }, word).join(" ") + ".";
      output.textContent = text;
    }
    unit._input.addEventListener("change", gen);
    root.append(h("div", { class: "tool-panel__grid cols-2" }, unit, count),
      h("div", { style: { display: "flex", gap: ".5rem", margin: ".75rem 0" } },
        h("button", { class: "btn btn--primary btn--sm", html: `${icon("refresh")} Generate`, onclick: gen }),
        copyButton(() => output.textContent, "Copy")),
      output);
    gen();
  },
});
