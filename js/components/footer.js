/**
 * Footer — brand, link columns, social, legal.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { categories } from "../core/registry.js";
import { navigate } from "../core/router.js";
import { t } from "../core/i18n.js";

export function buildFooter() {
  const col = (title, links) => h("div", { class: "footer__col" },
    h("h4", {}, title),
    ...links.map((l) => h("a", { href: l.path ? `#${l.path}` : "#/", onclick: (e) => { if (l.path) { e.preventDefault(); navigate(l.path); } } }, l.label)));

  return h("footer", { class: "footer" },
    h("div", { class: "container" },
      h("div", { class: "footer__grid" },
        h("div", { class: "footer__brand" },
          h("a", { class: "brand", href: "#/" },
            h("span", { class: "brand__mark", html: icon("zap") }),
            h("span", {}, "Life", h("span", { class: "gradient-text" }, "Tools"))),
          h("p", {}, t("footer.tagline"))),
        col(t("footer.categories"), categories.map((c) => ({ label: t(`cat.${c.id}`), path: `/category/${c.id}` }))),
        col(t("footer.product"), [
          { label: t("footer.allTools"), path: "/tools" },
          { label: t("footer.favorites"), path: "/favorites" },
          { label: t("footer.aiAssistant"), path: "/" },
          { label: t("footer.whatsNew"), path: "/tools" },
        ]),
        col(t("footer.company"), [
          { label: t("footer.about"), path: "/" }, { label: t("footer.privacy"), path: "/" },
          { label: t("footer.terms"), path: "/" }, { label: t("footer.contact"), path: "/" },
        ])),
      h("div", { class: "footer__bottom" },
        h("span", {}, t("footer.rights", { year: new Date().getFullYear() })),
        h("div", { class: "footer__social" },
          h("a", { href: "#/", "aria-label": "Twitter", html: icon("twitter") }),
          h("a", { href: "#/", "aria-label": "GitHub", html: icon("github") }),
          h("a", { href: "#/", "aria-label": "LinkedIn", html: icon("linkedin") })))));
}
