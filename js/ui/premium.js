/**
 * Premium UI — the paywall shown on locked tools, and the (fake) checkout flow.
 *
 * Flow when a user hits "Unlock":
 *   not logged in → auth modal (sign-up) → on success → checkout
 *   logged in     → checkout → payment provider → activate subscription
 *
 * The checkout is an explicit DEMO: it is clearly labelled, collects no real
 * card data (fields are pre-filled and read-only), and takes no real payment.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { t, tt } from "../core/i18n.js";
import { auth } from "../core/auth.js";
import { subscription, PRICE_PER_SEAT } from "../core/subscription.js";
import { paymentProvider } from "../services/payment.js";
import { toolCount } from "../core/registry.js";
import { toast } from "../components/toast.js";

/** The paywall element rendered in place of a locked tool. */
export function premiumGate(tool) {
  const name = tt(tool, "name");
  const benefits = t("auth.pwBenefits").map((b) =>
    h("li", {}, h("span", { class: "pw-check", html: icon("check") }), b.replace("{count}", `${toolCount()}`)));

  const cta = h("button", { class: "btn btn--primary btn--lg btn--block",
    onclick: () => openUpgrade() },
    h("span", { html: icon("lock") }), " ", auth.isLoggedIn() ? t("auth.pwUnlock") : t("auth.pwLoginFirst"));

  return h("div", { class: "paywall view" },
    h("div", { class: "paywall__badge" }, "🔒 ", t("auth.pwBadge")),
    h("h2", { class: "paywall__title" }, t("auth.pwTitle")),
    h("p", { class: "paywall__sub" }, t("auth.pwSubtitle", { name })),
    h("div", { class: "paywall__price" }, t("auth.perMonthSeat", { amount: PRICE_PER_SEAT })),
    h("div", { class: "paywall__benefits" },
      h("h3", {}, t("auth.pwBenefitsTitle")),
      h("ul", {}, ...benefits)),
    cta);
}

/** Entry point: ensure the user is logged in, then open checkout. */
export function openUpgrade() {
  if (!auth.isLoggedIn()) {
    toast(t("auth.loginRequired"), "info", 2600);
    window.LifeToolsAuth?.open("signup", { afterAuth: openCheckout });
    return;
  }
  openCheckout();
}

/* ---------------- Fake checkout ---------------- */
let coOverlay;

export function openCheckout() {
  if (!coOverlay) {
    coOverlay = h("div", { class: "checkout-overlay" });
    coOverlay.addEventListener("click", (e) => { if (e.target === coOverlay) coOverlay.classList.remove("is-open"); });
    document.body.append(coOverlay);
  }
  const seats = auth.currentUser()?.seats || 1;
  const total = subscription.priceFor(seats);

  const demoField = (label, value) => h("label", { class: "field" },
    h("span", { class: "field__label" }, label),
    h("input", { class: "input", value, readonly: true, tabindex: "-1" }));

  const payBtn = h("button", { class: "btn btn--primary btn--block", },
    h("span", { html: icon("lock") }), " " + t("auth.coPay"));

  const panel = h("div", { class: "checkout-panel", role: "dialog", "aria-modal": "true" },
    h("button", { class: "auth-close", "aria-label": "Close", html: icon("close"), onclick: () => coOverlay.classList.remove("is-open") }),
    h("div", { class: "checkout-head" },
      h("h2", {}, t("auth.coTitle")),
      h("div", { class: "checkout-demo" }, h("span", { html: icon("shield") }), t("auth.coDemo"))),
    h("div", { class: "checkout-summary" },
      h("div", { class: "checkout-row" }, h("span", {}, t("auth.coPlan")), h("b", {}, `${PRICE_PER_SEAT} €`)),
      h("div", { class: "checkout-row" }, h("span", {}, t("auth.coSeats")), h("b", {}, String(seats))),
      h("div", { class: "checkout-row checkout-row--total" }, h("span", {}, t("auth.coTotal")), h("b", {}, `${total} €`)),
      h("div", { class: "checkout-billed" }, t("auth.coBilled"))),
    h("div", { class: "checkout-card" },
      h("div", { class: "checkout-card__note" }, "💳 " + t("auth.coDemoCard")),
      demoField(t("auth.coCard"), "4242 4242 4242 4242"),
      h("div", { class: "checkout-card__row" },
        demoField(t("auth.coExpiry"), "12 / 34"),
        demoField(t("auth.coCvc"), "123"))),
    payBtn);

  coOverlay.innerHTML = "";
  coOverlay.append(panel);
  coOverlay.classList.add("is-open");

  payBtn.addEventListener("click", async () => {
    payBtn.disabled = true;
    payBtn.innerHTML = `<span class="spinner"></span> ${t("auth.coProcessing")}`;
    const res = await paymentProvider.checkout({
      plan: "PREMIUM", seats, amount: total, currency: "EUR", user: auth.currentUser(),
    });
    if (res.success) {
      subscription.activate({ seats });   // fires auth.onChange → app re-renders & unlocks
      coOverlay.classList.remove("is-open");
      toast(t("auth.coSuccess"), "success", 3200);
    } else {
      payBtn.disabled = false;
      payBtn.innerHTML = `<span>${icon("lock")}</span> ${t("auth.coPay")}`;
      toast("Payment failed", "error");
    }
  });
}
