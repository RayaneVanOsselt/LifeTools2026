/**
 * Store — a thin, namespaced localStorage wrapper with a pub/sub layer.
 * Persists favorites, recents, theme, settings, and per-tool history so the
 * platform can later grow into full user accounts without touching call sites.
 */

const NS = "lifetools:v1";
const listeners = new Map();

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(NS)) || {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(NS, JSON.stringify(data));
  } catch (e) {
    console.warn("[store] persist failed", e);
  }
}

const DEFAULTS = {
  favorites: [],
  recents: [],
  theme: "system",
  currency: "EUR",
  settings: { reduceMotion: false, newsletter: false },
  history: {},   // toolId -> [{ ts, label }]
  todos: [],
  habits: [],
};

let state = { ...DEFAULTS, ...readAll() };

export const store = {
  get(key) {
    return state[key];
  },
  set(key, value) {
    state[key] = value;
    writeAll(state);
    emit(key, value);
    return value;
  },
  update(key, fn) {
    return this.set(key, fn(structuredClone(state[key])));
  },
  /** Subscribe to a key; returns an unsubscribe fn. */
  on(key, cb) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(cb);
    return () => listeners.get(key)?.delete(cb);
  },
  reset() {
    state = { ...DEFAULTS };
    writeAll(state);
    for (const key of Object.keys(state)) emit(key, state[key]);
  },
};

function emit(key, value) {
  listeners.get(key)?.forEach((cb) => cb(value));
}

/* ---- Domain helpers ---- */

export function isFavorite(id) {
  return store.get("favorites").includes(id);
}

export function toggleFavorite(id) {
  const favs = store.get("favorites");
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  store.set("favorites", next);
  return next.includes(id);
}

export function pushRecent(id) {
  const recents = store.get("recents").filter((r) => r !== id);
  recents.unshift(id);
  store.set("recents", recents.slice(0, 12));
}

export function logCalculation(toolId, label) {
  const history = store.get("history");
  const list = history[toolId] || [];
  list.unshift({ ts: Date.now(), label });
  history[toolId] = list.slice(0, 20);
  store.set("history", { ...history });
}
