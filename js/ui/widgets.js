/**
 * Reusable tool widgets — form fields, result displays, charts, copy buttons.
 * Tools compose these instead of hand-rolling markup, keeping them consistent.
 */
import { h, copyText, downloadFile } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { toast } from "../components/toast.js";

/** Labelled input with optional prefix/suffix addon + hint + error slot. */
export function field({ label, hint, addon, addonSide = "right", ...attrs }) {
  const input = h("input", { class: "input", ...attrs });
  let control = input;
  if (addon) {
    control = h("div", { class: "input-group" });
    const box = h("span", { class: "input-group__addon" }, addon);
    if (addonSide === "left") control.append(box, input);
    else control.append(input, box);
  }
  const err = h("div", { class: "field__error" });
  const wrap = h(
    "label",
    { class: "field" },
    label && h("span", { class: "field__label" }, label),
    control,
    hint && h("span", { class: "field__hint" }, hint),
    err
  );
  wrap._input = input;
  wrap._error = err;
  return wrap;
}

export function selectField({ label, options, hint, ...attrs }) {
  const sel = h("select", { class: "select", ...attrs },
    ...options.map((o) =>
      h("option", { value: o.value ?? o }, o.label ?? o)
    )
  );
  const wrap = h("label", { class: "field" },
    label && h("span", { class: "field__label" }, label),
    sel,
    hint && h("span", { class: "field__hint" }, hint)
  );
  wrap._input = sel;
  return wrap;
}

export function textareaField({ label, hint, ...attrs }) {
  const ta = h("textarea", { class: "textarea", ...attrs });
  const wrap = h("label", { class: "field" },
    label && h("span", { class: "field__label" }, label),
    ta,
    hint && h("span", { class: "field__hint" }, hint)
  );
  wrap._input = ta;
  return wrap;
}

/** Range slider bound to a live value readout. */
export function rangeField({ label, min, max, step = 1, value, format = (v) => v, onInput }) {
  const out = h("b", {}, format(value));
  const input = h("input", {
    type: "range", class: "range", min, max, step, value,
    oninput: () => { out.textContent = format(+input.value); onInput?.(+input.value); },
  });
  const wrap = h("label", { class: "field" },
    h("span", { class: "field__label", style: { justifyContent: "space-between" } },
      h("span", {}, label), out),
    input
  );
  wrap._input = input;
  return wrap;
}

/** Segmented toggle (returns element; read .value). */
export function segmented(options, value, onChange) {
  const el = h("div", { class: "segmented", role: "tablist" });
  el.value = value ?? options[0].value;
  const render = () => {
    el.innerHTML = "";
    for (const o of options) {
      const b = h("button", {
        class: o.value === el.value ? "is-active" : "",
        role: "tab", "aria-selected": o.value === el.value,
        onclick: () => { el.value = o.value; render(); onChange?.(o.value); },
      }, o.label);
      el.append(b);
    }
  };
  render();
  return el;
}

/** The big hero result number. */
export function resultCard(children) {
  return h("div", { class: "result-card view" }, ...[].concat(children));
}

export function resultHero(label, value) {
  return h("div", { class: "result-hero" },
    h("div", { class: "result-hero__label" }, label),
    h("div", { class: "result-hero__value gradient-text" }, value)
  );
}

export function statGrid(stats) {
  return h("div", { class: "result-grid" },
    ...stats.map((s) => h("div", { class: "result-stat" },
      h("div", { class: "result-stat__value" }, s.value),
      h("div", { class: "result-stat__label" }, s.label)
    ))
  );
}

/** Copy-to-clipboard button. */
export function copyButton(getText, label = "Copy") {
  const btn = h("button", { class: "copy-btn", html: `${icon("copy")}<span>${label}</span>` });
  btn.addEventListener("click", async () => {
    const ok = await copyText(typeof getText === "function" ? getText() : getText);
    if (ok) {
      btn.classList.add("is-done");
      btn.innerHTML = `${icon("check")}<span>Copied</span>`;
      toast("Copied to clipboard", "success", 1600);
      setTimeout(() => {
        btn.classList.remove("is-done");
        btn.innerHTML = `${icon("copy")}<span>${label}</span>`;
      }, 1600);
    } else {
      toast("Couldn't copy", "error");
    }
  });
  return btn;
}

export function downloadButton(filename, getContent, mime = "text/plain", label = "Download") {
  return h("button", {
    class: "copy-btn",
    html: `${icon("download")}<span>${label}</span>`,
    onclick: () => {
      downloadFile(filename, typeof getContent === "function" ? getContent() : getContent, mime);
      toast(`Saved ${filename}`, "success", 1800);
    },
  });
}

/** Simple animated CSS bar chart. data = [{label, value}] */
export function barChart(data, { format = (v) => v } = {}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chart = h("div", { class: "bar-chart" },
    ...data.map((d) => {
      const bar = h("div", { class: "bar-chart__bar", title: format(d.value) });
      const col = h("div", { class: "bar-chart__col" },
        bar, h("div", { class: "bar-chart__label" }, d.label));
      requestAnimationFrame(() => { bar.style.height = `${(d.value / max) * 100}%`; });
      return col;
    })
  );
  return chart;
}

/** Donut chart via conic-gradient. segments = [{label,value,color}] */
export function donutChart(segments, centerLabel = "") {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(", ");
  const donut = h("div", { class: "donut", style: { background: `conic-gradient(${stops})` } },
    h("div", { class: "donut__center" }, h("b", {}, centerLabel)));
  const legend = h("div", { class: "legend" },
    ...segments.map((s) => h("div", { class: "legend__row" },
      h("span", { class: "legend__swatch", style: { background: s.color } }),
      h("span", {}, s.label),
      h("b", { style: { marginLeft: "auto" } }, `${Math.round((s.value / total) * 100)}%`)
    ))
  );
  return h("div", {}, donut, legend);
}

export function tip(text) {
  return h("div", { class: "tip-box", html: `<strong>💡 Tip:</strong> ${text}` });
}

export function fieldError(fieldEl, message) {
  if (fieldEl?._error) fieldEl._error.textContent = message || "";
}

/** Read numeric value from a field wrapper. */
export const val = (f) => (f?._input ? f._input.value : "");
export const numval = (f) => parseFloat(val(f));
