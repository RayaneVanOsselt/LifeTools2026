/**
 * Auth service — user accounts & session (prototype).
 *
 * ⚠️ SECURITY NOTE: this is a client-side prototype. Users, password hashes and
 * the session live in localStorage, which the user can read/modify. It is NOT
 * tamper-proof — real security requires a backend. This module is deliberately
 * shaped like a provider (signup/login/logout/session/onChange) so it can be
 * swapped for real API calls later WITHOUT changing the rest of the app.
 *
 * Passwords are hashed with SHA-256 + a per-user salt via Web Crypto. That is
 * fine for a demo but must be replaced by server-side hashing (bcrypt/argon2)
 * in production.
 */

const USERS_KEY = "lifetools:auth:users";
const SESSION_KEY = "lifetools:auth:session";
const listeners = new Set();
let currentUserCache = null;

/* ---- storage helpers ---- */
function readUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } }
function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } }
function writeSession(s) { if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY); }

/* ---- crypto helpers ---- */
function toHex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function randomHex(bytes = 16) { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return toHex(a); }
function newId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${randomHex(6)}`; }
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

/** Strip secrets before exposing a user to the UI layer. */
function sanitize(user) {
  if (!user) return null;
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

function computeCurrentUser() {
  const s = readSession();
  if (!s) return null;
  const user = readUsers().find((u) => u.id === s.userId);
  return sanitize(user);
}

function emit() {
  currentUserCache = computeCurrentUser();
  listeners.forEach((cb) => cb(currentUserCache));
}

export const auth = {
  init() { currentUserCache = computeCurrentUser(); },

  currentUser() { return currentUserCache; },
  isLoggedIn() { return !!currentUserCache; },

  /** Subscribe to auth-state changes (login/logout/profile update). */
  onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },

  async signup({ name, email, password }) {
    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    if (!name) return { ok: false, error: "required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "invalidEmail" };
    if (!password || password.length < 6) return { ok: false, error: "weakPassword" };

    const users = readUsers();
    if (users.some((u) => u.email === email)) return { ok: false, error: "emailExists" };

    const salt = randomHex();
    const now = new Date().toISOString();
    const user = {
      id: newId(), name, email,
      passwordHash: await hashPassword(password, salt), salt,
      subscriptionStatus: "FREE",   // FREE | ACTIVE | CANCELLED | EXPIRED
      subscriptionPlan: "FREE",     // FREE | PREMIUM
      subscriptionStartDate: null,
      subscriptionRenewalDate: null,
      seats: 1,
      createdAt: now, updatedAt: now,
    };
    users.push(user);
    writeUsers(users);
    writeSession({ userId: user.id, token: randomHex(24) });
    emit();
    return { ok: true, user: sanitize(user) };
  },

  async login({ email, password }) {
    email = (email || "").trim().toLowerCase();
    const user = readUsers().find((u) => u.email === email);
    if (!user) return { ok: false, error: "invalidCredentials" };
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return { ok: false, error: "invalidCredentials" };
    writeSession({ userId: user.id, token: randomHex(24) });
    emit();
    return { ok: true, user: sanitize(user) };
  },

  logout() { writeSession(null); emit(); },

  /** Patch the current user's record (used by the subscription layer). */
  updateCurrentUser(patch) {
    const s = readSession();
    if (!s) return null;
    const users = readUsers();
    const i = users.findIndex((u) => u.id === s.userId);
    if (i < 0) return null;
    users[i] = { ...users[i], ...patch, updatedAt: new Date().toISOString() };
    writeUsers(users);
    emit();
    return sanitize(users[i]);
  },

  /** Password reset — stub for a future backend/email integration. */
  async requestPasswordReset(email) {
    // A real implementation would POST to /api/auth/reset and email a link.
    return { ok: true, pending: true };
  },
};
