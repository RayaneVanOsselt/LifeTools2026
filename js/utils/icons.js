/**
 * Icon set — lightweight inline SVGs (stroke-based, currentColor).
 * Keeping icons inline avoids network/icon-font dependencies.
 */
const S = (paths, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

export const icons = {
  search: S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>'),
  moon: S('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18"/>'),
  star: S('<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>'),
  arrowRight: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowLeft: S('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  chevronDown: S('<path d="m6 9 6 6 6-6"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  copy: S('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  check: S('<path d="M20 6 9 17l-5-5"/>'),
  download: S('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  send: S('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>'),
  sparkle: S('<path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>'),
  bot: S('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 14h.01M15 14h.01M2 13v2M22 13v2"/>'),
  bell: S('<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/>'),
  heart: S('<path d="M12 20s-7-4.4-9.5-8.5C1 8 2.7 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.3 0 5 3.5 3.5 7C19 15.6 12 20 12 20z"/>'),
  clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  zap: S('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  shield: S('<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>'),
  lock: S('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  gift: S('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8M12 8S9 3 6.5 4.5 9 8 12 8zM12 8s3-5 5.5-3.5S15 8 12 8z"/>'),
  coins: S('<circle cx="8" cy="8" r="5"/><path d="M18.1 8.5a5 5 0 0 1 0 8.9M13.4 20.5a5 5 0 0 1-6.8-6.8"/>'),
  twitter: S('<path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.8 3.6A11.3 11.3 0 0 1 3.9 4.8a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 3.9c-.5.2-1.1.2-1.7.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6a11.3 11.3 0 0 0 17.4-9.5v-.5c.8-.6 1.5-1.3 2-2.2z"/>'),
  github: S('<path d="M9 19c-4.5 1.5-4.5-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.5 1.3a12 12 0 0 0-6.3 0C6.5 2 5.5 2.3 5.5 2.3a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 8.7c0 4.5 2.7 5.6 5.5 6-.6.6-.6 1.2-.5 2V20"/>'),
  linkedin: S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 12v5"/>'),
  grid: S('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  refresh: S('<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>'),
  info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  trash: S('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>'),
};

export function icon(name, extra = "") {
  const svg = icons[name] || icons.grid;
  return extra ? svg.replace("<svg ", `<svg ${extra} `) : svg;
}
