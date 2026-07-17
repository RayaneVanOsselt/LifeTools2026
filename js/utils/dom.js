/**
 * DOM utilities — tiny helpers to keep tool code declarative.
 */

/** Create an element from a tag, props, and children. */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(props)) {
    if (val == null || val === false) continue;
    if (key === "class") el.className = val;
    else if (key === "html") el.innerHTML = val;
    else if (key === "dataset") Object.assign(el.dataset, val);
    else if (key === "style" && typeof val === "object") Object.assign(el.style, val);
    else if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key in el && key !== "list") {
      try { el[key] = val; } catch { el.setAttribute(key, val); }
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Build an element tree from an HTML string, returning the first node. */
export function fromHTML(str) {
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content.firstElementChild;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Debounce a function. */
export function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Clamp a number. */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Copy text to clipboard with graceful fallback. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Trigger a client-side file download. */
export function downloadFile(filename, content, mime = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Attach a magnetic-hover interaction to a button-like element. */
export function magnetize(el, strength = 0.35) {
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const reset = () => { el.style.transform = ""; };
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", reset);
}
