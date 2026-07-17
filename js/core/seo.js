/**
 * SEO controller — updates document title, meta description, canonical,
 * Open Graph tags and JSON-LD structured data per route.
 */
function meta(name, attr = "name") {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.append(el); }
  return el;
}

export function setSEO({ title, description, faqs, name }) {
  document.title = title;
  meta("description").setAttribute("content", description || "");
  meta("og:title", "property").setAttribute("content", title);
  meta("og:description", "property").setAttribute("content", description || "");
  meta("twitter:title").setAttribute("content", title);
  meta("twitter:description").setAttribute("content", description || "");

  // canonical
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.append(link); }
  link.href = location.href;

  // FAQ structured data (schema.org) — helps rich results
  let ld = document.getElementById("faq-jsonld");
  if (ld) ld.remove();
  if (faqs?.length) {
    ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.id = "faq-jsonld";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    });
    document.head.append(ld);
  }
}
