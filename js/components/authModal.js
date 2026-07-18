/**
 * Auth modal — login & sign-up in one overlay, with validation, inline errors,
 * and an optional `afterAuth` callback (used to chain into checkout).
 * Exposes window.LifeToolsAuth so any component can trigger it.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { auth } from "../core/auth.js";
import { toast } from "./toast.js";
import { t } from "../core/i18n.js";

export function initAuthModal() {
  let mode = "login";        // "login" | "signup"
  let afterAuth = null;
  let busy = false;

  const overlay = h("div", { class: "auth-overlay" });
  const panel = h("div", { class: "auth-panel", role: "dialog", "aria-modal": "true" });
  overlay.append(panel);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("is-open")) close(); });
  document.body.append(overlay);

  function open(startMode = "login", opts = {}) {
    mode = startMode; afterAuth = opts.afterAuth || null;
    render();
    overlay.classList.add("is-open");
    setTimeout(() => panel.querySelector("input")?.focus(), 250);
  }
  function close() { overlay.classList.remove("is-open"); afterAuth = null; }

  function render() {
    const isSignup = mode === "signup";
    panel.innerHTML = "";

    const err = h("div", { class: "auth-error", role: "alert" });
    const fields = [];
    const nameField = inputRow({ id: "au-name", label: t("auth.name"), placeholder: t("auth.namePh"), type: "text", autocomplete: "name" });
    const emailField = inputRow({ id: "au-email", label: t("auth.email"), placeholder: t("auth.emailPh"), type: "email", autocomplete: "email" });
    const passField = inputRow({ id: "au-pass", label: t("auth.password"), placeholder: t("auth.passwordPh"), type: "password", autocomplete: isSignup ? "new-password" : "current-password" });

    if (isSignup) fields.push(nameField);
    fields.push(emailField, passField);

    const submitBtn = h("button", { class: "btn btn--primary btn--block", type: "submit" },
      isSignup ? t("auth.create") : t("auth.login"));

    const form = h("form", { class: "auth-form", novalidate: true },
      ...fields.map((f) => f.wrap), err, submitBtn);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      err.textContent = "";
      const email = emailField.input.value;
      const password = passField.input.value;
      const name = nameField.input.value;

      busy = true; submitBtn.disabled = true; submitBtn.classList.add("is-loading");
      submitBtn.textContent = "…";
      let res;
      if (isSignup) res = await auth.signup({ name, email, password });
      else res = await auth.login({ email, password });
      busy = false; submitBtn.disabled = false; submitBtn.classList.remove("is-loading");
      submitBtn.textContent = isSignup ? t("auth.create") : t("auth.login");

      if (!res.ok) { err.textContent = t(`auth.err${cap(res.error)}`); return; }

      const user = auth.currentUser();
      toast(isSignup ? t("auth.welcome", { name: user.name }) : t("auth.welcomeBack", { name: user.name }), "success");
      const cb = afterAuth;
      close();
      cb?.();
    });

    // Forgot password (login only) — stub for future integration.
    const forgot = !isSignup
      ? h("button", { class: "auth-forgot", type: "button", onclick: () => toast(t("auth.forgotDone"), "info", 3600) }, t("auth.forgot"))
      : null;

    const switcher = h("div", { class: "auth-switch" },
      h("span", {}, isSignup ? t("auth.haveAccount") : t("auth.noAccount")),
      h("button", { type: "button", onclick: () => { mode = isSignup ? "login" : "signup"; render(); } },
        isSignup ? t("auth.login") : t("auth.create")));

    // Filter out null (e.g. `forgot` in signup mode) — append(null) would insert
    // a literal "null" text node.
    panel.append(...[
      h("button", { class: "auth-close", "aria-label": "Close", html: icon("close"), onclick: close }),
      h("div", { class: "auth-head" },
        h("span", { class: "brand__mark", html: icon("zap") }),
        h("h2", {}, isSignup ? t("auth.signupTitle") : t("auth.loginTitle")),
        h("p", {}, isSignup ? t("auth.signupSub") : t("auth.loginSub"))),
      form,
      forgot,
      switcher,
    ].filter(Boolean));
  }

  window.LifeToolsAuth = { open, close };
  return { open, close };
}

function inputRow({ id, label, ...attrs }) {
  const input = h("input", { id, class: "input", ...attrs });
  const wrap = h("label", { class: "field", for: id },
    h("span", { class: "field__label" }, label), input);
  return { wrap, input };
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
