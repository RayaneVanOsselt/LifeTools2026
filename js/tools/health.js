/**
 * Health & lifestyle tools — BMI, calories (TDEE), water intake, age,
 * sleep calculator, habit tracker.
 */
import { register } from "../core/registry.js";
import { h } from "../utils/dom.js";
import { num } from "../utils/format.js";
import { store } from "../core/store.js";
import {
  field, selectField, rangeField, segmented, resultCard, resultHero,
  statGrid, numval,
} from "../ui/widgets.js";
import { icon } from "../utils/icons.js";
import { toast } from "../components/toast.js";

function grid(...f) { return h("div", { class: "tool-panel__grid cols-2" }, ...f); }

/* ---------------- BMI ---------------- */
register({
  id: "bmi", category: "health", icon: "⚖️", featured: true,
  name: "BMI Calculator",
  tagline: "Body Mass Index with healthy-range guidance.",
  keywords: ["bmi", "body mass", "weight", "health", "obesity"],
  about: "Body Mass Index estimates whether your weight is in a healthy range for your height. It's a quick screening tool, not a diagnosis.",
  steps: ["Choose metric or imperial units", "Enter your height and weight", "Read your BMI and category"],
  tips: ["BMI doesn't distinguish muscle from fat — athletes may read as 'overweight'.", "Pair BMI with waist measurement for a fuller picture."],
  faqs: [
    { q: "What is a healthy BMI?", a: "For most adults, 18.5–24.9 is considered a healthy range. Below 18.5 is underweight; 25–29.9 overweight; 30+ obese." },
    { q: "Does BMI work for everyone?", a: "It's less accurate for very muscular people, the elderly, and during pregnancy. Treat it as one signal among many." },
  ],
  mount(root) {
    let unit = "metric";
    const height = field({ label: "Height", type: "number", value: "175", addon: "cm" });
    const weight = field({ label: "Weight", type: "number", value: "70", addon: "kg" });
    const seg = segmented([{ value: "metric", label: "Metric" }, { value: "imperial", label: "Imperial" }], "metric", (v) => {
      unit = v;
      height._input.parentElement.querySelector(".input-group__addon").textContent = v === "metric" ? "cm" : "in";
      weight._input.parentElement.querySelector(".input-group__addon").textContent = v === "metric" ? "kg" : "lb";
      calc();
    });
    const out = h("div");
    function calc() {
      let hCm = numval(height), kg = numval(weight);
      if (unit === "imperial") { hCm = numval(height) * 2.54; kg = numval(weight) * 0.4536; }
      const m = hCm / 100;
      const bmi = m > 0 ? kg / (m * m) : 0;
      let cat, color;
      if (bmi < 18.5) { cat = "Underweight"; color = "var(--info)"; }
      else if (bmi < 25) { cat = "Healthy"; color = "var(--success)"; }
      else if (bmi < 30) { cat = "Overweight"; color = "var(--warning)"; }
      else { cat = "Obese"; color = "var(--danger)"; }
      const idealMin = 18.5 * m * m, idealMax = 24.9 * m * m;
      out.replaceChildren(resultCard([
        resultHero("Your BMI", isFinite(bmi) ? bmi.toFixed(1) : "—"),
        h("div", { style: { textAlign: "center", fontWeight: "700", color, marginBottom: "1rem" } }, cat),
        statGrid([
          { label: "Healthy weight range", value: `${num(idealMin, { maximumFractionDigits: 0 })}–${num(idealMax, { maximumFractionDigits: 0 })} ${unit === "metric" ? "kg" : "lb"}` },
        ]),
      ]));
    }
    [height, weight].forEach((f) => f._input.addEventListener("input", calc));
    root.append(seg, h("div", { style: { height: "1rem" } }), grid(height, weight), out);
    calc();
  },
});

/* ---------------- Calorie / TDEE ---------------- */
register({
  id: "calories", category: "health", icon: "🔥", featured: true,
  name: "Calorie Calculator",
  tagline: "Daily calories to maintain, lose or gain.",
  keywords: ["calorie", "tdee", "bmr", "diet", "macros", "weight loss"],
  about: "Estimate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation, then get calorie targets for your goal.",
  steps: ["Enter age, sex, height and weight", "Select your activity level", "Choose your goal", "See your daily calorie target"],
  tips: ["A deficit of ~500 kcal/day loses roughly 0.5 kg per week.", "Protein around 1.6–2.2 g per kg of body weight helps preserve muscle."],
  faqs: [{ q: "How accurate is this?", a: "The Mifflin-St Jeor equation is among the most accurate estimates, but individual metabolism varies ±10%. Adjust based on real-world results over a few weeks." }],
  mount(root) {
    const age = field({ label: "Age", type: "number", value: "30", min: "10", max: "100" });
    const sex = selectField({ label: "Sex", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] });
    const height = field({ label: "Height", type: "number", value: "175", addon: "cm" });
    const weight = field({ label: "Weight", type: "number", value: "70", addon: "kg" });
    const activity = selectField({ label: "Activity level", options: [
      { value: "1.2", label: "Sedentary (little exercise)" },
      { value: "1.375", label: "Light (1–3 days/week)" },
      { value: "1.55", label: "Moderate (3–5 days/week)" },
      { value: "1.725", label: "Active (6–7 days/week)" },
      { value: "1.9", label: "Very active (physical job)" },
    ]});
    activity._input.value = "1.55";
    const goal = selectField({ label: "Goal", options: [
      { value: "-500", label: "Lose weight (−0.5 kg/wk)" },
      { value: "0", label: "Maintain" },
      { value: "500", label: "Gain weight (+0.5 kg/wk)" },
    ]});
    const out = h("div");
    function calc() {
      const a = numval(age), hCm = numval(height), kg = numval(weight);
      const s = sex._input.value === "male" ? 5 : -161;
      const bmr = 10 * kg + 6.25 * hCm - 5 * a + s;
      const tdee = bmr * +activity._input.value;
      const target = tdee + +goal._input.value;
      out.replaceChildren(resultCard([
        resultHero("Daily target", `${num(target, { maximumFractionDigits: 0 })} kcal`),
        statGrid([
          { label: "BMR (at rest)", value: `${num(bmr, { maximumFractionDigits: 0 })} kcal` },
          { label: "Maintenance (TDEE)", value: `${num(tdee, { maximumFractionDigits: 0 })} kcal` },
          { label: "Protein target", value: `${num(kg * 1.8, { maximumFractionDigits: 0 })} g` },
        ]),
      ]));
    }
    [age, height, weight].forEach((f) => f._input.addEventListener("input", calc));
    [sex, activity, goal].forEach((f) => f._input.addEventListener("change", calc));
    root.append(grid(age, sex, height, weight), h("div", { style: { height: ".75rem" } }), grid(activity, goal), out);
    calc();
  },
});

/* ---------------- Water intake ---------------- */
register({
  id: "water", category: "health", icon: "💧",
  name: "Water Intake Calculator",
  tagline: "How much water you should drink daily.",
  keywords: ["water", "hydration", "drink", "intake"],
  about: "Estimate your daily water needs based on body weight and activity. Hydration needs rise with exercise, heat and altitude.",
  steps: ["Enter your weight", "Add your daily exercise minutes", "See your recommended intake in litres and glasses"],
  tips: ["Thirst is a late signal — sip regularly rather than waiting.", "Add ~350 ml for every 30 minutes of intense exercise."],
  faqs: [{ q: "Does coffee count?", a: "Mostly yes — the diuretic effect of moderate caffeine is small, so tea and coffee contribute to hydration." }],
  mount(root) {
    const weight = field({ label: "Weight", type: "number", value: "70", addon: "kg" });
    const exercise = rangeField({ label: "Exercise", min: 0, max: 180, step: 5, value: 30, format: (v) => `${v} min`, onInput: calc });
    const out = h("div");
    function calc() {
      const kg = numval(weight) || 0;
      const base = kg * 0.033;
      const extra = (numval(exercise) / 30) * 0.35;
      const litres = base + extra;
      out.replaceChildren(resultCard([
        resultHero("Daily water", `${litres.toFixed(2)} L`),
        statGrid([
          { label: "Glasses (250 ml)", value: `${Math.round(litres * 1000 / 250)}` },
          { label: "Bottles (500 ml)", value: `${(litres * 1000 / 500).toFixed(1)}` },
        ]),
      ]));
    }
    weight._input.addEventListener("input", calc);
    root.append(grid(weight, exercise), out);
    calc();
  },
});

/* ---------------- Age calculator ---------------- */
register({
  id: "age", category: "health", icon: "🎂",
  name: "Age Calculator",
  tagline: "Your exact age in years, months & days.",
  keywords: ["age", "birthday", "date", "how old"],
  about: "Calculate your precise age from your date of birth — down to days — plus fun stats like your total days lived and next birthday countdown.",
  steps: ["Enter your date of birth", "Optionally set a target date", "See your exact age and milestones"],
  tips: ["Use the target date to find how old you'll be on a future occasion."],
  faqs: [{ q: "How are months counted?", a: "The tool counts complete calendar months and the remaining days, matching how people usually state their age." }],
  mount(root) {
    const dob = field({ label: "Date of birth", type: "date", value: "1995-06-15" });
    const at = field({ label: "Age at date", type: "date", value: new Date().toISOString().slice(0, 10) });
    const out = h("div");
    function calc() {
      const b = new Date(dob._input.value), t = new Date(at._input.value);
      if (isNaN(b) || isNaN(t) || t < b) { out.replaceChildren(resultCard(resultHero("Age", "—"))); return; }
      let y = t.getFullYear() - b.getFullYear();
      let m = t.getMonth() - b.getMonth();
      let d = t.getDate() - b.getDate();
      if (d < 0) { m--; d += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      const totalDays = Math.floor((t - b) / 86400000);
      const next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
      if (next < t) next.setFullYear(t.getFullYear() + 1);
      const daysToBirthday = Math.ceil((next - t) / 86400000);
      out.replaceChildren(resultCard([
        resultHero("You are", `${y} yr ${m} mo ${d} d`),
        statGrid([
          { label: "Total days", value: num(totalDays) },
          { label: "Total weeks", value: num(Math.floor(totalDays / 7)) },
          { label: "Next birthday", value: `${daysToBirthday} days` },
        ]),
      ]));
    }
    [dob, at].forEach((f) => f._input.addEventListener("input", calc));
    root.append(grid(dob, at), out);
    calc();
  },
});

/* ---------------- Sleep calculator ---------------- */
register({
  id: "sleep", category: "health", icon: "😴",
  name: "Sleep Calculator",
  tagline: "Best bed & wake times by sleep cycles.",
  keywords: ["sleep", "bedtime", "wake", "cycle", "rest"],
  about: "Sleep happens in ~90-minute cycles. Waking at the end of a cycle leaves you refreshed rather than groggy. This tool finds ideal bed or wake times.",
  steps: ["Choose whether you know your wake time or bedtime", "Enter the time", "Pick one of the suggested cycle-aligned times"],
  tips: ["It takes about 14 minutes on average to fall asleep — the tool factors this in.", "Aim for 5–6 full cycles (7.5–9 hours) for most adults."],
  faqs: [{ q: "Why 90 minutes?", a: "A full sleep cycle through light, deep and REM sleep averages roughly 90 minutes. Waking between cycles feels best." }],
  mount(root) {
    let mode = "wake"; // I want to wake at ...
    const seg = segmented([
      { value: "wake", label: "I want to wake at" },
      { value: "bed", label: "I'm going to bed now" },
    ], "wake", (v) => { mode = v; time.style.display = v === "wake" ? "" : "none"; calc(); });
    const time = field({ label: "Time", type: "time", value: "07:00" });
    const out = h("div");
    function fmt(d) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    function calc() {
      const results = [];
      const fallAsleep = 14 * 60000;
      if (mode === "wake") {
        const [hh, mm] = time._input.value.split(":").map(Number);
        const wake = new Date(); wake.setHours(hh, mm, 0, 0);
        for (let c = 6; c >= 4; c--) {
          const bed = new Date(wake - c * 90 * 60000 - fallAsleep);
          results.push({ time: fmt(bed), cycles: c });
        }
        renderList("Go to bed at", results);
      } else {
        const now = new Date(Date.now() + fallAsleep);
        for (let c = 4; c <= 6; c++) {
          const wake = new Date(now.getTime() + c * 90 * 60000);
          results.push({ time: fmt(wake), cycles: c });
        }
        renderList("Wake up at", results);
      }
    }
    function renderList(label, results) {
      out.replaceChildren(resultCard([
        h("div", { class: "result-hero__label", style: { textAlign: "center", marginBottom: ".75rem" } }, label),
        h("div", { style: { display: "grid", gap: ".5rem" } },
          ...results.map((r, i) => h("div", {
            class: "result-stat",
            style: { display: "flex", justifyContent: "space-between", alignItems: "center",
              borderColor: i === (mode === "wake" ? 1 : 1) ? "var(--primary)" : "var(--border)" },
          },
            h("b", { style: { fontSize: "var(--fs-xl)" } }, r.time),
            h("span", { class: "result-stat__label" }, `${r.cycles} cycles · ${(r.cycles * 1.5).toFixed(1)}h`)
          ))
        ),
      ]));
    }
    time._input.addEventListener("input", calc);
    root.append(seg, h("div", { style: { height: "1rem" } }), time, out);
    calc();
  },
});

/* ---------------- Habit tracker ---------------- */
register({
  id: "habits", category: "health", icon: "✅",
  name: "Daily Habit Tracker",
  tagline: "Build streaks and track daily habits.",
  keywords: ["habit", "tracker", "streak", "routine", "goals"],
  about: "Track the habits you want to build. Tick them off each day to grow a streak — your progress is saved on your device.",
  steps: ["Add the habits you want to build", "Check them off as you complete them today", "Watch your streak grow"],
  tips: ["Start with just 1–3 habits — consistency beats quantity.", "Attach a new habit to an existing routine (habit stacking)."],
  faqs: [{ q: "Is my data private?", a: "Yes — habits are stored only in your browser's local storage, never sent anywhere." }],
  mount(root) {
    const today = new Date().toISOString().slice(0, 10);
    const input = field({ label: "New habit", placeholder: "e.g. Drink water, Read 10 pages", type: "text" });
    const addBtn = h("button", { class: "btn btn--primary", style: { marginTop: ".5rem" }, html: `${icon("plus")} Add habit` });
    const list = h("div", { style: { display: "grid", gap: ".5rem", marginTop: "1.5rem" } });
    function render() {
      const habits = store.get("habits");
      list.innerHTML = "";
      if (!habits.length) { list.append(h("div", { class: "empty-state" }, h("div", { class: "empty-state__icon" }, "🌱"), "No habits yet. Add your first above.")); return; }
      for (const hb of habits) {
        const done = hb.lastDone === today;
        const row = h("div", { class: "result-stat", style: { display: "flex", alignItems: "center", gap: ".75rem", textAlign: "left" } },
          h("button", {
            class: `fav-btn ${done ? "is-fav" : ""}`, style: { background: done ? "var(--emerald-500)" : "var(--bg-sunken)", color: done ? "#fff" : "var(--text-faint)", width: "34px", height: "34px" },
            html: done ? icon("check") : "",
            onclick: () => toggle(hb.id),
          }),
          h("div", { style: { flex: "1" } },
            h("div", { style: { fontWeight: "600" } }, hb.name),
            h("div", { class: "result-stat__label" }, `🔥 ${hb.streak || 0} day streak`)),
          h("button", { class: "fav-btn", html: icon("trash"), onclick: () => remove(hb.id) })
        );
        list.append(row);
      }
    }
    function toggle(id) {
      store.update("habits", (habits) => habits.map((hb) => {
        if (hb.id !== id) return hb;
        if (hb.lastDone === today) { hb.streak = Math.max(0, (hb.streak || 1) - 1); hb.lastDone = null; }
        else {
          const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          hb.streak = hb.lastDone === yest ? (hb.streak || 0) + 1 : 1;
          hb.lastDone = today;
          toast("Nice! Keep the streak going 🔥", "success", 1800);
        }
        return hb;
      }));
      render();
    }
    function remove(id) { store.update("habits", (hs) => hs.filter((h) => h.id !== id)); render(); }
    function add() {
      const name = input._input.value.trim();
      if (!name) return;
      store.update("habits", (hs) => [...hs, { id: Date.now().toString(36), name, streak: 0, lastDone: null }]);
      input._input.value = "";
      render();
    }
    addBtn.addEventListener("click", add);
    input._input.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    root.append(input, addBtn, list);
    render();
  },
});
