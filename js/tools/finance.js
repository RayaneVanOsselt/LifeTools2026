/**
 * Finance tools — VAT, loan, mortgage, compound interest, savings goal,
 * salary (gross→net), budget planner, investment return, currency converter.
 */
import { register } from "../core/registry.js";
import { h } from "../utils/dom.js";
import { money, num, percent, CURRENCIES, setCurrency } from "../utils/format.js";
import { store, logCalculation } from "../core/store.js";
import {
  field, selectField, rangeField, resultCard, resultHero, statGrid,
  barChart, donutChart, numval,
} from "../ui/widgets.js";

const CUR = () => store.get("currency");

/* ---------------- VAT calculator ---------------- */
register({
  id: "vat", category: "finance", icon: "🧾", featured: true,
  name: "VAT Calculator",
  tagline: "Add or remove VAT from any amount in a click.",
  keywords: ["vat", "tax", "btw", "tva", "sales tax", "gst"],
  about: "Calculate value-added tax both ways — add VAT to a net price, or strip VAT out of a gross price to reveal the base amount and the tax portion.",
  steps: ["Enter the amount", "Pick your VAT rate (or type a custom one)", "Choose whether to add or remove VAT", "Read the net, VAT and gross breakdown"],
  tips: ["Most EU countries use a standard rate between 17% and 27%.", "Use 'Remove VAT' on receipts to find the pre-tax price."],
  faqs: [
    { q: "How is VAT calculated?", a: "To add VAT: gross = net × (1 + rate). To remove it: net = gross ÷ (1 + rate). The VAT amount is the difference." },
    { q: "Can I use a custom rate?", a: "Yes — choose 'Custom' and type any percentage, including reduced rates like 6% or 9%." },
  ],
  mount(root) {
    const amount = field({ label: "Amount", type: "number", value: "100", min: "0", step: "0.01", addon: "€", addonSide: "left" });
    const rate = selectField({ label: "VAT rate", options: [
      { value: "21", label: "21% (standard)" }, { value: "20", label: "20%" },
      { value: "19", label: "19%" }, { value: "9", label: "9% (reduced)" },
      { value: "6", label: "6% (reduced)" }, { value: "custom", label: "Custom…" },
    ]});
    const custom = field({ label: "Custom rate", type: "number", value: "21", min: "0", step: "0.1", addon: "%" });
    custom.style.display = "none";
    const mode = selectField({ label: "Direction", options: [
      { value: "add", label: "Add VAT (net → gross)" },
      { value: "remove", label: "Remove VAT (gross → net)" },
    ]});
    const out = h("div");

    rate._input.addEventListener("change", () => {
      custom.style.display = rate._input.value === "custom" ? "" : "none";
      calc();
    });

    function calc() {
      const amt = numval(amount) || 0;
      const r = (rate._input.value === "custom" ? numval(custom) : +rate._input.value) / 100;
      let net, gross, vat;
      if (mode._input.value === "add") { net = amt; gross = amt * (1 + r); vat = gross - net; }
      else { gross = amt; net = amt / (1 + r); vat = gross - net; }
      out.replaceChildren(resultCard([
        resultHero("Gross (incl. VAT)", money(gross, CUR())),
        statGrid([
          { label: "Net (excl. VAT)", value: money(net, CUR()) },
          { label: `VAT (${(r * 100).toFixed(1)}%)`, value: money(vat, CUR()) },
        ]),
      ]));
      logCalculation("vat", `${money(amt, CUR())} @ ${(r * 100).toFixed(1)}%`);
    }
    [amount, custom, mode].forEach((f) => f._input.addEventListener("input", calc));
    root.append(grid(amount, rate, custom, mode), out);
    calc();
  },
});

/* ---------------- Loan & mortgage (shared engine) ---------------- */
function amortization(principal, annualRate, years) {
  const n = Math.round(years * 12);
  const r = annualRate / 100 / 12;
  const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  const total = monthly * n;
  return { monthly, total, interest: total - principal, months: n, r, principal };
}

function loanTool(id, name, icon, tagline, defaults, extra = {}) {
  register({
    id, category: "finance", icon, name, tagline,
    keywords: ["loan", "mortgage", "credit", "repayment", "interest", "emi", ...(extra.keywords || [])],
    featured: extra.featured,
    about: `Estimate monthly repayments, total interest and the full cost of a ${name.toLowerCase().replace(" calculator", "")} using the standard amortization formula.`,
    steps: ["Enter the amount you want to borrow", "Set the annual interest rate", "Choose the term in years", "See your monthly payment and total interest"],
    tips: ["A shorter term means higher monthly payments but far less total interest.", "Even a 0.5% lower rate can save thousands over the life of the loan."],
    faqs: [
      { q: "How is the monthly payment calculated?", a: "It uses the amortization formula M = P·r / (1 − (1+r)⁻ⁿ), where r is the monthly rate and n the number of months." },
      { q: "Does this include taxes or insurance?", a: "No — this estimates principal and interest only. Add property tax and insurance separately for a full housing cost." },
    ],
    mount(root) {
      const amount = field({ label: "Amount", type: "number", value: defaults.amount, min: "0", step: "100", addon: "€", addonSide: "left" });
      const rate = rangeField({ label: "Interest rate", min: 0, max: 15, step: 0.05, value: defaults.rate, format: (v) => `${v.toFixed(2)}%`, onInput: calc });
      const years = rangeField({ label: "Term (years)", min: 1, max: defaults.maxYears || 40, step: 1, value: defaults.years, format: (v) => `${v} yr`, onInput: calc });
      const out = h("div");
      function calc() {
        const a = amortization(numval(amount) || 0, numval(rate) || 0, numval(years) || 1);
        out.replaceChildren(resultCard([
          resultHero("Monthly payment", money(a.monthly, CUR())),
          statGrid([
            { label: "Total repaid", value: money(a.total, CUR()) },
            { label: "Total interest", value: money(a.interest, CUR()) },
            { label: "Payments", value: `${a.months}` },
          ]),
          h("div", { style: { marginTop: "1.5rem" } },
            donutChart([
              { label: "Principal", value: a.principal, color: "var(--brand-500)" },
              { label: "Interest", value: a.interest, color: "var(--violet-500)" },
            ], money(a.total, CUR(), { maximumFractionDigits: 0 }))),
        ]));
        logCalculation(id, `${money(a.principal, CUR())} @ ${numval(rate)}%`);
      }
      amount._input.addEventListener("input", calc);
      root.append(grid(amount, rate, years), out);
      calc();
    },
  });
}
loanTool("loan", "Loan Calculator", "🏦", "Monthly payments & total interest for any loan.", { amount: "15000", rate: 6.5, years: 5, maxYears: 15 }, { featured: true });
loanTool("mortgage", "Mortgage Calculator", "🏡", "Plan your home loan with amortization.", { amount: "250000", rate: 3.5, years: 25, maxYears: 40 }, { featured: true, keywords: ["home", "house", "property"] });

/* ---------------- Compound interest ---------------- */
register({
  id: "compound-interest", category: "finance", icon: "📈", featured: true,
  name: "Compound Interest Calculator",
  tagline: "See how your money grows over time.",
  keywords: ["compound", "interest", "growth", "investment", "returns"],
  about: "Project the future value of an initial deposit plus regular contributions, compounded over time. The magic of compounding means earlier contributions grow the most.",
  steps: ["Enter your starting amount", "Add a monthly contribution", "Set the expected annual return", "Choose how many years to project"],
  tips: ["Starting early beats contributing more later — time is the biggest lever.", "Reinvesting returns (compounding) dramatically outpaces simple interest."],
  faqs: [
    { q: "What return should I assume?", a: "Historically, a diversified stock portfolio has returned roughly 6–8% per year over the long term, before inflation." },
    { q: "Is this guaranteed?", a: "No. Projections assume a constant rate; real markets fluctuate. Use it as an estimate, not a promise." },
  ],
  mount(root) {
    const initial = field({ label: "Initial amount", type: "number", value: "5000", min: "0", addon: "€", addonSide: "left" });
    const monthly = field({ label: "Monthly contribution", type: "number", value: "200", min: "0", addon: "€", addonSide: "left" });
    const rate = rangeField({ label: "Annual return", min: 0, max: 20, step: 0.1, value: 7, format: (v) => `${v.toFixed(1)}%`, onInput: calc });
    const years = rangeField({ label: "Years", min: 1, max: 50, step: 1, value: 20, format: (v) => `${v} yr`, onInput: calc });
    const out = h("div");
    function calc() {
      const P = numval(initial) || 0, PMT = numval(monthly) || 0;
      const r = (numval(rate) || 0) / 100 / 12, n = (numval(years) || 1) * 12;
      const fvP = P * Math.pow(1 + r, n);
      const fvPMT = r === 0 ? PMT * n : PMT * ((Math.pow(1 + r, n) - 1) / r);
      const total = fvP + fvPMT;
      const contributed = P + PMT * n;
      const growth = total - contributed;
      // yearly series for the bar chart (max 10 columns)
      const yrs = numval(years) || 1;
      const step = Math.max(1, Math.round(yrs / 8));
      const series = [];
      for (let y = step; y <= yrs; y += step) {
        const m = y * 12;
        const v = P * Math.pow(1 + r, m) + (r === 0 ? PMT * m : PMT * ((Math.pow(1 + r, m) - 1) / r));
        series.push({ label: `${y}y`, value: v });
      }
      out.replaceChildren(resultCard([
        resultHero("Future value", money(total, CUR(), { maximumFractionDigits: 0 })),
        statGrid([
          { label: "You contributed", value: money(contributed, CUR(), { maximumFractionDigits: 0 }) },
          { label: "Interest earned", value: money(growth, CUR(), { maximumFractionDigits: 0 }) },
          { label: "Growth", value: percent((growth / (contributed || 1)) * 100, 0) },
        ]),
        barChart(series, { format: (v) => money(v, CUR(), { maximumFractionDigits: 0 }) }),
      ]));
      logCalculation("compound-interest", `${money(total, CUR())} in ${yrs}y`);
    }
    [initial, monthly].forEach((f) => f._input.addEventListener("input", calc));
    root.append(grid(initial, monthly, rate, years), out);
    calc();
  },
});

/* ---------------- Savings goal ---------------- */
register({
  id: "savings", category: "finance", icon: "🐷",
  name: "Savings Goal Calculator",
  tagline: "Find out how much to save each month.",
  keywords: ["savings", "goal", "save money", "target"],
  about: "Work backwards from a savings goal to the monthly amount you need to set aside, optionally accounting for interest on your savings.",
  steps: ["Enter your savings target", "Add any amount you've already saved", "Set your timeframe", "See the monthly amount required"],
  tips: ["Automate the monthly transfer on payday so you never see the money.", "A high-yield savings account reduces how much you need to contribute."],
  faqs: [
    { q: "Does it include interest?", a: "Yes — set an annual savings rate and the tool reduces the required monthly amount accordingly." },
  ],
  mount(root) {
    const goal = field({ label: "Savings goal", type: "number", value: "10000", min: "0", addon: "€", addonSide: "left" });
    const have = field({ label: "Already saved", type: "number", value: "1000", min: "0", addon: "€", addonSide: "left" });
    const months = rangeField({ label: "Timeframe", min: 1, max: 120, step: 1, value: 24, format: (v) => `${v} mo`, onInput: calc });
    const rate = rangeField({ label: "Savings rate", min: 0, max: 8, step: 0.1, value: 2, format: (v) => `${v.toFixed(1)}%`, onInput: calc });
    const out = h("div");
    function calc() {
      const target = Math.max(0, (numval(goal) || 0) - (numval(have) || 0));
      const n = numval(months) || 1, r = (numval(rate) || 0) / 100 / 12;
      const start = numval(have) || 0;
      const fvStart = start * Math.pow(1 + r, n);
      const remaining = Math.max(0, (numval(goal) || 0) - fvStart);
      const monthly = r === 0 ? remaining / n : remaining * r / (Math.pow(1 + r, n) - 1);
      out.replaceChildren(resultCard([
        resultHero("Save each month", money(monthly, CUR())),
        statGrid([
          { label: "Goal", value: money(numval(goal) || 0, CUR()) },
          { label: "To go", value: money(target, CUR()) },
          { label: "Over", value: `${n} months` },
        ]),
      ]));
    }
    [goal, have].forEach((f) => f._input.addEventListener("input", calc));
    root.append(grid(goal, have, months, rate), out);
    calc();
  },
});

/* ---------------- Investment return ---------------- */
register({
  id: "investment-return", category: "finance", icon: "💹",
  name: "Investment Return Calculator",
  tagline: "Measure ROI and annualized return.",
  keywords: ["roi", "return", "investment", "profit", "cagr"],
  about: "Calculate the return on an investment: total profit, ROI percentage, and the compound annual growth rate (CAGR) over your holding period.",
  steps: ["Enter the amount invested", "Enter the final value", "Set how long you held it", "Read your ROI and annualized return"],
  tips: ["CAGR smooths returns into a single yearly figure, ideal for comparing investments.", "Don't forget fees and taxes — they eat into real returns."],
  faqs: [{ q: "What is CAGR?", a: "Compound Annual Growth Rate — the steady yearly rate that would grow your initial amount to the final value over the period." }],
  mount(root) {
    const invested = field({ label: "Amount invested", type: "number", value: "10000", min: "0", addon: "€", addonSide: "left" });
    const final = field({ label: "Final value", type: "number", value: "16000", min: "0", addon: "€", addonSide: "left" });
    const years = rangeField({ label: "Years held", min: 0.5, max: 40, step: 0.5, value: 5, format: (v) => `${v} yr`, onInput: calc });
    const out = h("div");
    function calc() {
      const p = numval(invested) || 0, f = numval(final) || 0, y = numval(years) || 1;
      const profit = f - p;
      const roi = p ? (profit / p) * 100 : 0;
      const cagr = p > 0 && f > 0 ? (Math.pow(f / p, 1 / y) - 1) * 100 : 0;
      out.replaceChildren(resultCard([
        resultHero("Total return", percent(roi, 1)),
        statGrid([
          { label: "Profit", value: money(profit, CUR()) },
          { label: "Annualized (CAGR)", value: percent(cagr, 2) },
          { label: "Multiple", value: `${(f / (p || 1)).toFixed(2)}×` },
        ]),
      ]));
    }
    [invested, final].forEach((f) => f._input.addEventListener("input", calc));
    root.append(grid(invested, final, years), out);
    calc();
  },
});

/* ---------------- Salary gross → net (simplified) ---------------- */
register({
  id: "salary", category: "finance", icon: "💼", featured: true,
  name: "Salary Calculator",
  tagline: "Estimate take-home pay from gross salary.",
  keywords: ["salary", "gross", "net", "wage", "income", "take home", "pay"],
  about: "Convert a gross salary into estimated net take-home pay using a simplified progressive tax model. Adjust the effective tax and social contribution rates to match your country.",
  steps: ["Enter your annual gross salary", "Adjust the tax and social-contribution rates", "See your estimated net monthly and yearly pay"],
  tips: ["This is a simplified estimate — real payroll depends on local brackets, allowances and credits.", "Increase the pay-period count to 13 or 14 for regions with extra months."],
  faqs: [{ q: "How accurate is this?", a: "It's an estimate using flat effective rates you control. For exact figures, consult your local tax authority or payslip." }],
  mount(root) {
    const gross = field({ label: "Annual gross salary", type: "number", value: "48000", min: "0", addon: "€", addonSide: "left" });
    const tax = rangeField({ label: "Income tax rate", min: 0, max: 55, step: 0.5, value: 22, format: (v) => `${v}%`, onInput: calc });
    const social = rangeField({ label: "Social contributions", min: 0, max: 25, step: 0.5, value: 13, format: (v) => `${v}%`, onInput: calc });
    const periods = selectField({ label: "Pay periods / year", options: [
      { value: "12", label: "12 (monthly)" }, { value: "13", label: "13 months" }, { value: "14", label: "14 months" },
    ]});
    const out = h("div");
    function calc() {
      const g = numval(gross) || 0;
      const soc = g * (numval(social) / 100);
      const taxable = g - soc;
      const inc = taxable * (numval(tax) / 100);
      const net = g - soc - inc;
      const p = +periods._input.value;
      out.replaceChildren(resultCard([
        resultHero("Net per month", money(net / p, CUR())),
        statGrid([
          { label: "Net per year", value: money(net, CUR()) },
          { label: "Income tax", value: money(inc, CUR()) },
          { label: "Social", value: money(soc, CUR()) },
        ]),
        h("div", { style: { marginTop: "1.5rem" } }, donutChart([
          { label: "Net pay", value: net, color: "var(--emerald-500)" },
          { label: "Income tax", value: inc, color: "var(--rose-500)" },
          { label: "Social contributions", value: soc, color: "var(--amber-500)" },
        ], money(g, CUR(), { maximumFractionDigits: 0 }))),
      ]));
    }
    gross._input.addEventListener("input", calc);
    periods._input.addEventListener("change", calc);
    root.append(grid(gross, periods, tax, social), out);
    calc();
  },
});

/* ---------------- Budget planner (50/30/20) ---------------- */
register({
  id: "budget", category: "finance", icon: "📊",
  name: "Budget Planner",
  tagline: "Split your income with the 50/30/20 rule.",
  keywords: ["budget", "expenses", "50/30/20", "planner", "spending"],
  about: "The 50/30/20 rule allocates your after-tax income into needs (50%), wants (30%) and savings or debt repayment (20%). Adjust the split to fit your life.",
  steps: ["Enter your monthly take-home income", "Fine-tune the needs / wants / savings split", "See how much to allocate to each bucket"],
  tips: ["If needs exceed 50%, look for fixed-cost savings like rent or subscriptions.", "Treat the savings bucket as a non-negotiable bill."],
  faqs: [{ q: "What counts as a 'need'?", a: "Essentials you can't skip: housing, groceries, utilities, transport, insurance and minimum debt payments." }],
  mount(root) {
    const income = field({ label: "Monthly take-home income", type: "number", value: "3000", min: "0", addon: "€", addonSide: "left" });
    const needs = rangeField({ label: "Needs", min: 0, max: 100, step: 1, value: 50, format: (v) => `${v}%`, onInput: sync });
    const wants = rangeField({ label: "Wants", min: 0, max: 100, step: 1, value: 30, format: (v) => `${v}%`, onInput: sync });
    const note = h("div", { class: "field__hint" });
    const out = h("div");
    function sync() { calc(); }
    function calc() {
      const inc = numval(income) || 0;
      let n = numval(needs), w = numval(wants);
      let s = 100 - n - w;
      note.textContent = s < 0 ? "Needs + wants exceed 100% — reduce a slider." : `Savings: ${s}%`;
      s = Math.max(0, s);
      out.replaceChildren(resultCard([
        h("div", { style: { marginTop: ".5rem" } }, donutChart([
          { label: "Needs", value: n, color: "var(--brand-500)" },
          { label: "Wants", value: w, color: "var(--violet-500)" },
          { label: "Savings", value: s, color: "var(--emerald-500)" },
        ], money(inc, CUR(), { maximumFractionDigits: 0 }))),
        statGrid([
          { label: `Needs (${n}%)`, value: money(inc * n / 100, CUR()) },
          { label: `Wants (${w}%)`, value: money(inc * w / 100, CUR()) },
          { label: `Savings (${s}%)`, value: money(inc * s / 100, CUR()) },
        ]),
      ]));
    }
    income._input.addEventListener("input", calc);
    root.append(grid(income, needs, wants), note, out);
    calc();
  },
});

/* ---------------- Currency converter ---------------- */
// Static reference rates (base EUR). Real rates would come from an API later.
const RATES = { EUR: 1, USD: 1.08, GBP: 0.85, JPY: 171.5, CHF: 0.95, CAD: 1.47, AUD: 1.64, INR: 90.2, CNY: 7.85, BRL: 5.9 };
register({
  id: "currency", category: "finance", icon: "💱", featured: true,
  name: "Currency Converter",
  tagline: "Convert between world currencies.",
  keywords: ["currency", "exchange", "forex", "convert", "money", "usd", "eur", "gbp"],
  about: "Convert amounts between major world currencies using reference exchange rates. Built so a live rates API can be plugged in later without changing the interface.",
  steps: ["Enter an amount", "Choose the source currency", "Choose the target currency", "Read the converted value"],
  tips: ["Reference rates are indicative — banks add a spread of 1–3% on real transfers.", "For travel, compare card fees against local ATM withdrawals."],
  faqs: [{ q: "Are these live rates?", a: "No — they're static reference rates for estimation. The tool is architected to connect a live rates API in the future." }],
  mount(root) {
    const list = Object.keys(RATES).map((c) => ({ value: c, label: c }));
    const amount = field({ label: "Amount", type: "number", value: "100", min: "0" });
    const from = selectField({ label: "From", options: list });
    const to = selectField({ label: "To", options: list });
    to._input.value = "USD";
    const out = h("div");
    const swap = h("button", { class: "btn btn--ghost btn--sm", html: "⇅ Swap", style: { marginTop: ".5rem" },
      onclick: () => { const t = from._input.value; from._input.value = to._input.value; to._input.value = t; calc(); } });
    function calc() {
      const amt = numval(amount) || 0;
      const eur = amt / RATES[from._input.value];
      const res = eur * RATES[to._input.value];
      const rate = RATES[to._input.value] / RATES[from._input.value];
      out.replaceChildren(resultCard([
        resultHero(`${num(amt)} ${from._input.value} =`, `${num(res, { maximumFractionDigits: 2 })} ${to._input.value}`),
        h("div", { class: "field__hint", style: { textAlign: "center" } }, `1 ${from._input.value} = ${num(rate, { maximumFractionDigits: 4 })} ${to._input.value}`),
      ]));
    }
    amount._input.addEventListener("input", calc);
    [from, to].forEach((f) => f._input.addEventListener("change", calc));
    root.append(grid(amount, from, to), swap, out);
    calc();
  },
});

/* ---- shared layout helper ---- */
function grid(...fields) {
  return h("div", { class: "tool-panel__grid cols-2" }, ...fields);
}

/* Currency selector for the whole app is wired in settings; expose CURRENCIES here. */
export function currencyOptions() { return CURRENCIES; }
export { setCurrency };
