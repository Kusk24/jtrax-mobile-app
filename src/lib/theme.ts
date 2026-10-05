/**
 * The portals' colours, light and dark — Appearance (Auto / Light / Dark).
 *
 * The values are the web app's (app/globals.css): the `pp-*` palette the
 * parent and student portals share, and the `st-*` accents the student screens
 * add. The web switches them with `data-theme` on the portal shell; here they
 * are CSS variables set at the root (`ThemeProvider`), which every
 * `bg-pp-card` / `text-pp-ink` class reads. Icons cannot take a class, so they
 * get the same hexes through `usePalette()`.
 *
 * Plain TypeScript, so the rules can be tested without React Native: which
 * scheme an account's choice means, and that every token has both values.
 */

/** The parent and student portals' palette. pp-deep, pp-navy and pp-green-dot
    keep one value: on the web those surfaces are dark in both themes. */
export const PP_LIGHT = {
  ink: "#1a2b4a",
  blue: "#2e5cb8",
  deep: "#234a9f",
  navy: "#1e3a70",
  line: "#e7ebf3",
  soft: "#e8eefa",
  mist: "#f0f4fc",
  bg: "#fafbfd",
  card: "#ffffff",
  panel: "#e8edf8",
  muted: "#525d78",
  faint: "#5a6b8c",
  sub: "#4a5578",
  green: "#2e7350",
  greenSoft: "#e6f4ec",
  greenDot: "#33734d",
  red: "#b83f3a",
  redSoft: "#fbeaea",
  amber: "#8f5410",
  amberSoft: "#f0e6dc",
  danger: "#a83b3b",
  dangerSoft: "#fdece0",
  dangerLine: "#e7c9c9",
  dangerHover: "#fdf3f3",
  plumSoft: "#efeefa",
  track: "#f3e6d8",
  barTrack: "#dbe6f7",
  neutral: "#eef1f7",
  dash: "#d5cdbd",
} as const;

export type PPKey = keyof typeof PP_LIGHT;
export type Palette<K extends string> = Record<K, string>;

export const PP_DARK: Palette<PPKey> = {
  ink: "#e7edfa",
  blue: "#85aaee",
  deep: "#234a9f",
  navy: "#1e3a70",
  line: "#2a3a5c",
  soft: "#20304f",
  mist: "#1c2843",
  bg: "#0f1729",
  card: "#182238",
  panel: "#24304e",
  muted: "#a8b4cf",
  faint: "#8c9bbd",
  sub: "#b0bbd6",
  green: "#7cc9a0",
  greenSoft: "#23473a",
  greenDot: "#33734d",
  red: "#e58b8b",
  redSoft: "#523232",
  amber: "#e0a967",
  amberSoft: "#4e3a1b",
  danger: "#f09a9a",
  dangerSoft: "#523232",
  dangerLine: "#6b4444",
  dangerHover: "#3a2626",
  plumSoft: "#383060",
  track: "#4e3a1b",
  barTrack: "#2a3a5c",
  neutral: "#2a3550",
  dash: "#3f5075",
};

/** The student screens' accents beyond the shared palette: the Daily
    Challenge card's blues, the friend/streak orange, the star gold, and the
    three game tiles' tints. */
export const ST_LIGHT = {
  hero: "#dce5f7",
  orange: "#ea580c",
  orangeSoft: "#fff7ed",
  orangeLine: "#ffedd5",
  gold: "#d97706",
  goldSoft: "#fffbeb",
  brand: "#254edb",
  brandDeep: "#1d3fa8",
  brandInk: "#0f1e54",
  brandSoft: "#eef2ff",
  brandLine: "#e0e7ff",
  heroA: "#ebf2ff",
  heroB: "#e4eeff",
  heroC: "#dde9ff",
  heroLine: "#cfdffc",
  ring: "#c7dcfd",
  indigo: "#4f46e5",
  indigoSoft: "#f3f5ff",
  indigoLine: "#e0e7ff",
  amber: "#d97706",
  amberSoft: "#fffcf2",
  amberLine: "#fef3c7",
  emerald: "#059669",
  emeraldSoft: "#f1fdf7",
  emeraldLine: "#d1fae5",
} as const;

export type STKey = keyof typeof ST_LIGHT;

export const ST_DARK: Palette<STKey> = {
  hero: "#1a2844",
  orange: "#fb923c",
  orangeSoft: "#3f2410",
  orangeLine: "#5a3312",
  gold: "#fbbf24",
  goldSoft: "#3d300e",
  brand: "#5b7cf0",
  brandDeep: "#9db2ff",
  brandInk: "#e7edfa",
  brandSoft: "#1f2a4d",
  brandLine: "#2e3a66",
  heroA: "#1a2844",
  heroB: "#1b2a48",
  heroC: "#1d2d4e",
  heroLine: "#2a3a5c",
  ring: "#2a3a5c",
  indigo: "#a5b4fc",
  indigoSoft: "#1f2447",
  indigoLine: "#2e3566",
  amber: "#fbbf24",
  amberSoft: "#33270f",
  amberLine: "#4e3a1b",
  emerald: "#6ee7b7",
  emeraldSoft: "#12302a",
  emeraldLine: "#1d4a38",
};

export type Scheme = "light" | "dark";
/** What the account stores (`theme_preference`) — "System" is Auto. */
export type ThemePreference = "System" | "Light" | "Dark";

export type Colours = { pp: Palette<PPKey>; st: Palette<STKey> };

export const COLOURS: Record<Scheme, Colours> = {
  light: { pp: PP_LIGHT, st: ST_LIGHT },
  dark: { pp: PP_DARK, st: ST_DARK },
};

/** An account's stored preference, or Auto for anything unrecognised — an
    older account has none, and following the device is the default nobody
    has to think about. */
export function preferenceOf(stored: string | null | undefined): ThemePreference {
  return stored === "Light" || stored === "Dark" ? stored : "System";
}

/** The scheme to draw: the account's choice, else the device's. */
export function schemeOf(pref: ThemePreference, device: string | null | undefined): Scheme {
  if (pref === "Light") return "light";
  if (pref === "Dark") return "dark";
  return device === "dark" ? "dark" : "light";
}

/** "greenSoft" → "green-soft", the token's name in a class. */
export const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** "#2e5cb8" → "46 92 184", the form `rgb(var(--pp-blue) / <alpha-value>)`
    needs, so `bg-pp-blue/40` still works. */
export function channels(hex: string): string {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
}

/** The CSS variables for a scheme: `--pp-ink`, `--st-brand-deep`, … */
export function cssVariables(scheme: Scheme): Record<string, string> {
  const out: Record<string, string> = {};
  const { pp, st } = COLOURS[scheme];
  for (const [k, v] of Object.entries(pp)) out[`--pp-${kebab(k)}`] = channels(v);
  for (const [k, v] of Object.entries(st)) out[`--st-${kebab(k)}`] = channels(v);
  return out;
}
