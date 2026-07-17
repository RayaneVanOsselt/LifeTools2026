/**
 * Hash router — lightweight, dependency-free client-side routing.
 * Routes are registered as patterns like "/tool/:id".
 */
const routes = [];
let notFound = () => {};
let onNavigate = () => {};

function compile(pattern) {
  const keys = [];
  const rx = new RegExp(
    "^" + pattern.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return "([^/]+)"; }) + "$"
  );
  return { rx, keys };
}

export function route(pattern, handler) {
  routes.push({ ...compile(pattern), handler });
}

export function setNotFound(fn) { notFound = fn; }
export function setOnNavigate(fn) { onNavigate = fn; }

export function navigate(path) {
  if (!path.startsWith("/")) path = "/" + path;
  if (location.hash === "#" + path) resolve();
  else location.hash = path;
}

export function currentPath() {
  return location.hash.slice(1) || "/";
}

export function resolve() {
  const path = currentPath();
  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) {
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      onNavigate(path);
      r.handler(params);
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      return;
    }
  }
  onNavigate(path);
  notFound();
}

export function startRouter() {
  window.addEventListener("hashchange", resolve);
  resolve();
}
