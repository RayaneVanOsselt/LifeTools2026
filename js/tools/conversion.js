/**
 * Conversion tools — universal unit converter (length, weight, temperature,
 * time, data/file size, speed, area, volume).
 */
import { register } from "../core/registry.js";
import { h } from "../utils/dom.js";
import { num } from "../utils/format.js";
import { field, selectField, resultCard, resultHero, numval } from "../ui/widgets.js";

/**
 * Unit categories. Each unit is expressed as a factor relative to a base unit,
 * except temperature which needs formulas.
 */
const UNITS = {
  length: {
    base: "m",
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, "nautical mi": 1852 },
  },
  weight: {
    base: "kg",
    units: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592, st: 6.35029 },
  },
  time: {
    base: "s",
    units: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600 },
  },
  data: {
    base: "B",
    units: { bit: 0.125, B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5 },
  },
  speed: {
    base: "m/s",
    units: { "m/s": 1, "km/h": 0.277778, mph: 0.44704, knot: 0.514444, "ft/s": 0.3048 },
  },
  area: {
    base: "m²",
    units: { "cm²": 0.0001, "m²": 1, "km²": 1e6, "ft²": 0.092903, acre: 4046.86, hectare: 10000 },
  },
  volume: {
    base: "L",
    units: { ml: 0.001, L: 1, "m³": 1000, "gal (US)": 3.78541, "gal (UK)": 4.54609, cup: 0.236588, "fl oz": 0.0295735 },
  },
};

const CATS = [
  { id: "length", name: "Length", icon: "📏", from: "m", to: "ft" },
  { id: "weight", name: "Weight", icon: "⚖️", from: "kg", to: "lb" },
  { id: "temperature", name: "Temperature", icon: "🌡️", from: "C", to: "F" },
  { id: "time", name: "Time", icon: "⏳", from: "h", to: "min" },
  { id: "data", name: "Data / File size", icon: "💾", from: "MB", to: "GB" },
  { id: "speed", name: "Speed", icon: "🚀", from: "km/h", to: "mph" },
  { id: "area", name: "Area", icon: "🗺️", from: "m²", to: "ft²" },
  { id: "volume", name: "Volume", icon: "🧪", from: "L", to: "gal (US)" },
];

function convertTemp(v, from, to) {
  let c = from === "C" ? v : from === "F" ? (v - 32) * 5 / 9 : v - 273.15;
  return to === "C" ? c : to === "F" ? c * 9 / 5 + 32 : c + 273.15;
}

function buildConverter(cat) {
  return (root) => {
    const isTemp = cat === "temperature";
    const unitList = isTemp
      ? [{ value: "C", label: "Celsius (°C)" }, { value: "F", label: "Fahrenheit (°F)" }, { value: "K", label: "Kelvin (K)" }]
      : Object.keys(UNITS[cat].units).map((u) => ({ value: u, label: u }));
    const meta = CATS.find((c) => c.id === cat);
    const amount = field({ label: "Value", type: "number", value: "1", step: "any" });
    const from = selectField({ label: "From", options: unitList });
    const to = selectField({ label: "To", options: unitList });
    from._input.value = meta.from; to._input.value = meta.to;
    const out = h("div");
    const swap = h("button", { class: "btn btn--ghost btn--sm", style: { marginTop: ".5rem" }, html: "⇅ Swap units",
      onclick: () => { const t = from._input.value; from._input.value = to._input.value; to._input.value = t; calc(); } });
    function calc() {
      const v = numval(amount); if (!isFinite(v)) { out.replaceChildren(resultCard(resultHero("Result", "—"))); return; }
      let res;
      if (isTemp) res = convertTemp(v, from._input.value, to._input.value);
      else { const u = UNITS[cat].units; res = v * u[from._input.value] / u[to._input.value]; }
      out.replaceChildren(resultCard([
        resultHero(`${num(v, { maximumFractionDigits: 6 })} ${from._input.value} =`, `${num(res, { maximumFractionDigits: 6 })} ${to._input.value}`),
      ]));
    }
    amount._input.addEventListener("input", calc);
    [from, to].forEach((f) => f._input.addEventListener("change", calc));
    root.append(h("div", { class: "tool-panel__grid cols-2" }, amount, from, to), swap, out);
    calc();
  };
}

// A master converter plus dedicated single-purpose tools that reuse the engine.
register({
  id: "unit-converter", category: "conversion", icon: "🔄", featured: true,
  name: "Unit Converter",
  tagline: "Convert length, weight, speed, area, volume & more.",
  keywords: ["unit", "converter", "convert", "measurement", "metric", "imperial"],
  about: "A universal converter covering length, weight, temperature, time, data, speed, area and volume. Switch category and get instant, precise results.",
  steps: ["Pick a category", "Choose the units to convert between", "Enter a value for an instant result"],
  tips: ["Use 'Swap units' to quickly reverse a conversion."],
  faqs: [{ q: "How precise are the results?", a: "Conversions use exact factors (e.g. 1 inch = 0.0254 m) so results are accurate to several decimal places." }],
  mount(root) {
    let cat = "length";
    const tabs = h("div", { style: { display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: "1.25rem" } });
    const body = h("div");
    function select(id) {
      cat = id;
      [...tabs.children].forEach((b) => b.classList.toggle("is-active", b.dataset.cat === id));
      body.innerHTML = "";
      buildConverter(id)(body);
    }
    for (const c of CATS) {
      tabs.append(h("button", { class: "chip", dataset: { cat: c.id }, html: `${c.icon} ${c.name}`, onclick: () => select(c.id) }));
    }
    root.append(tabs, body);
    select("length");
  },
});

// Dedicated converters (great for SEO / direct links) reuse buildConverter.
function dedicated(id, name, icon, cat, tagline, keywords) {
  register({
    id, category: "conversion", icon, name, tagline, keywords,
    about: `Quickly convert ${name.replace(" Converter", "").toLowerCase()} between common units with instant, precise results.`,
    steps: ["Enter a value", "Choose your units", "Read the converted result"],
    tips: ["Prefer the universal Unit Converter when you need many categories at once."],
    faqs: [{ q: "Is this accurate?", a: "Yes — it uses exact conversion factors and updates live as you type." }],
    mount: buildConverter(cat === "temperature" ? "temperature" : cat),
  });
}
dedicated("length-converter", "Length Converter", "📏", "length", "Metres, feet, miles, inches & more.", ["length", "distance", "meters", "feet", "miles"]);
dedicated("weight-converter", "Weight Converter", "⚖️", "weight", "Kilograms, pounds, ounces & more.", ["weight", "mass", "kg", "pounds", "ounces"]);
dedicated("temperature-converter", "Temperature Converter", "🌡️", "temperature", "Celsius, Fahrenheit & Kelvin.", ["temperature", "celsius", "fahrenheit", "kelvin"]);
dedicated("time-converter", "Time Converter", "⏳", "time", "Seconds, minutes, hours, days & years.", ["time", "seconds", "minutes", "hours", "days"]);
dedicated("filesize-converter", "File Size Converter", "💾", "data", "Bytes, KB, MB, GB & TB.", ["file size", "bytes", "kb", "mb", "gb", "data"]);
