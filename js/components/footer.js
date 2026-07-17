/**
 * Footer — brand, link columns, social, legal.
 */
import { h } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { categories } from "../core/registry.js";
import { navigate } from "../core/router.js";

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
          h("p", {}, "The premium home for smart everyday tools. Free, private, and built to make your day easier.")),
        col("Categories", categories.map((c) => ({ label: c.name, path: `/category/${c.id}` }))),
        col("Product", [
          { label: "All tools", path: "/tools" },
          { label: "Favorites", path: "/favorites" },
          { label: "AI assistant", path: "/" },
          { label: "What's new", path: "/tools" },
        ]),
        col("Company", [
          { label: "About", path: "/" }, { label: "Privacy", path: "/" },
          { label: "Terms", path: "/" }, { label: "Contact", path: "/" },
        ])),
      h("div", { class: "footer__bottom" },
        h("span", {}, `© ${new Date().getFullYear()} LifeTools. Crafted with care. All calculations run locally in your browser.`),
        h("div", { class: "footer__social" },
          h("a", { href: "#/", "aria-label": "Twitter", html: icon("twitter") }),
          h("a", { href: "#/", "aria-label": "GitHub", html: icon("github") }),
          h("a", { href: "#/", "aria-label": "LinkedIn", html: icon("linkedin") })))));
}
