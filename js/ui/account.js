/**
 * Account view (#/account) — profile, subscription status, module access,
 * and subscription management (upgrade / cancel / resume / logout).
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { t, tt, intlLocale } from "../core/i18n.js";
import { auth } from "../core/auth.js";
import { subscription, PRICE_PER_SEAT } from "../core/subscription.js";
import { allTools, categories } from "../core/registry.js";
import { isPremiumTool, PREMIUM_CATEGORIES } from "../core/access.js";
import { navigate } from "../core/router.js";
import { toast } from "../components/toast.js";
import { setSEO } from "../core/seo.js";
import { openUpgrade } from "./premium.js";
import { observeReveals } from "./components.js";

function fmtDate(iso) {
  if (!iso) return t("auth.na");
  return new Date(iso).toLocaleDateString(intlLocale(), { day: "numeric", month: "long", year: "numeric" });
}

export function renderAccount(root) {
  setSEO({ title: t("auth.myAccount") + " — LifeTools", description: t("auth.myAccount") });
  root.innerHTML = "";
  const user = auth.currentUser();

  if (!user) {
    root.append(h("div", { class: "section container view" },
      h("div", { class: "empty-state" },
        h("div", { class: "empty-state__icon" }, "🔐"),
        h("h2", { style: { marginBottom: ".5rem" } }, t("auth.signIn")),
        h("p", { style: { marginBottom: "1.5rem" } }, t("auth.loginSub")),
        h("button", { class: "btn btn--primary", onclick: () => window.LifeToolsAuth?.open("login") }, t("auth.signIn")))));
    return;
  }

  const sub = subscription.summary(user);
  const premium = sub.premium;

  root.append(h("div", { class: "section container view account" },
    h("div", { class: "section__head reveal" },
      h("span", { class: "eyebrow" }, h("span", { class: "chip__dot" }), t("auth.myAccount")),
      h("h1", { class: "section__title" }, user.name)),
    h("div", { class: "account-grid" },
      profileCard(user, sub),
      subscriptionCard(user, sub, premium),
      modulesCard(premium))));
  observeReveals(root);
}

function profileCard(user, sub) {
  return h("div", { class: "side-card account-card reveal" },
    h("h3", {}, h("span", { html: icon("bot") }), t("auth.myAccount")),
    row(t("auth.name"), user.name),
    row(t("auth.email"), user.email),
    row(t("auth.memberSince"), fmtDate(user.createdAt)),
    h("button", { class: "btn btn--ghost btn--block", style: { marginTop: "1rem" }, html: `${icon("arrowLeft")} ${t("auth.logout")}`,
      onclick: () => { auth.logout(); toast(t("auth.loggedOut"), "info"); navigate("/"); } }));
}

function subscriptionCard(user, sub, premium) {
  const statusKey = premium
    ? (sub.status === "CANCELLED" ? "statusCancelled" : "statusActive")
    : "statusFree";

  const card = h("div", { class: `side-card account-card ${premium ? "account-card--premium" : ""} reveal` },
    h("h3", {}, h("span", { html: icon("star") }), t("auth.subscription")),
    h("div", { class: "account-plan" },
      h("span", { class: `plan-badge ${premium ? "plan-badge--premium" : "plan-badge--free"}` },
        premium ? "★ " + t("auth.planPremium") : t("auth.planFree")),
      h("span", { class: "account-status" }, t(`auth.${statusKey}`))),
    row(t("auth.price"), premium ? t("auth.perMonthSeat", { amount: sub.price }) : "—"),
    row(t("auth.startDate"), fmtDate(sub.startDate)),
    row(t("auth.nextRenewal"), fmtDate(sub.renewalDate)),
    row(t("auth.seats"), String(sub.seats)));

  if (!premium) {
    card.append(
      h("p", { class: "account-hint" }, t("auth.freeHint")),
      h("button", { class: "btn btn--primary btn--block", style: { marginTop: ".75rem" },
        html: `${icon("zap")} ${t("auth.upgrade")}`, onclick: openUpgrade }));
  } else if (sub.status === "CANCELLED") {
    card.append(h("p", { class: "account-hint" }, t("auth.autoRenewOff")),
      h("button", { class: "btn btn--primary btn--block", style: { marginTop: ".75rem" },
        html: `${icon("refresh")} ${t("auth.resume")}`,
        onclick: () => { subscription.resume(); toast(t("auth.resumeDone"), "success"); } }));
  } else {
    card.append(h("button", { class: "btn btn--ghost btn--block", style: { marginTop: "1rem" },
      html: t("auth.cancel"),
      onclick: () => {
        if (confirm(t("auth.cancelConfirm", { date: fmtDate(sub.renewalDate) }))) {
          subscription.cancel(); toast(t("auth.cancelDone"), "info", 3200);
        }
      } }));
  }
  return card;
}

function modulesCard(premium) {
  const freeCats = categories.filter((c) => !PREMIUM_CATEGORIES.has(c.id));
  const premiumCats = categories.filter((c) => PREMIUM_CATEGORIES.has(c.id));
  const premiumCount = allTools().filter(isPremiumTool).length;
  const freeCount = allTools().length - premiumCount;

  const catList = (cats, unlocked) => h("div", { class: "account-modules" },
    ...cats.map((c) => h("div", { class: `account-module ${unlocked ? "is-unlocked" : "is-locked"}` },
      h("span", { class: "account-module__icon" }, c.icon),
      h("span", {}, t(`cat.${c.id}`)),
      h("span", { class: "account-module__state" },
        unlocked ? h("span", { class: "tag tag--ok", html: `${icon("check")}` }) : h("span", { class: "tag tag--lock", html: icon("lock") })))));

  const card = h("div", { class: "side-card account-card reveal" },
    h("h3", {}, h("span", { html: icon("grid") }), t("auth.modules")),
    h("div", { class: "account-modline" }, h("span", {}, t("auth.modulesFree")), h("b", {}, `${freeCount}`)),
    catList(freeCats, true),
    h("div", { class: "account-modline", style: { marginTop: "1rem" } },
      h("span", {}, premium ? t("auth.modulesUnlocked") : t("auth.modulesLocked")), h("b", {}, `${premiumCount}`)),
    catList(premiumCats, premium));

  return card;
}

function row(label, value) {
  return h("div", { class: "account-row" },
    h("span", { class: "account-row__label" }, label),
    h("span", { class: "account-row__value" }, value));
}
