/** @type {import('tailwindcss').Config} */

/* Every token in src/lib/theme.ts, by name. A test (src/lib/theme.test.ts)
   fails when the two lists drift apart. */
const PP_TOKENS = [
  "ink", "blue", "deep", "navy", "line", "soft", "mist", "bg", "card", "panel",
  "muted", "faint", "sub", "green", "green-soft", "green-dot", "red", "red-soft",
  "amber", "amber-soft", "danger", "danger-soft", "danger-line", "danger-hover",
  "plum-soft", "track", "bar-track", "neutral", "dash",
];
const ST_TOKENS = [
  "hero", "orange", "orange-soft", "orange-line", "gold", "gold-soft",
  "brand", "brand-deep", "brand-ink", "brand-soft", "brand-line",
  "hero-a", "hero-b", "hero-c", "hero-line", "ring",
  "indigo", "indigo-soft", "indigo-line", "amber", "amber-soft", "amber-line",
  "emerald", "emerald-soft", "emerald-line",
];

/** `pp-ink` → `rgb(var(--pp-ink) / <alpha-value>)`, so opacity modifiers
    such as `bg-pp-blue/40` keep working. */
function themed(prefix, names) {
  return Object.fromEntries(
    names.map((n) => [`${prefix}-${n}`, `rgb(var(--${prefix}-${n}) / <alpha-value>)`]),
  );
}

// Palette copied from jtrax-web-app main (app/globals.css @theme). Keep the
// names identical to the web tokens — web screens port here near-verbatim, so
// a divergent name here costs a translation pass on every copy.
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#f7fafd",
        card: "#ffffff",
        navy: "#24417c",
        "navy-deep": "#1b3260",
        "navy-soft": "#d9e4f5",
        ink: "#22304a",
        muted: "#4e5f7b",
        line: "#e2e9f3",
        brick: "#c24b4b",
        "brick-soft": "#fbeaea",
        maroon: "#9d4343",
        olive: "#2f7a4c",
        "olive-soft": "#e6f4ec",
        highlight: "#dce8f8",
        "highlight-ink": "#2f4d80",
        accent: "#3a5da5",
        gold: "#8a5a1e",

        /* The portals' palette — names identical to the web's pp-* and st-*
           tokens, values from CSS variables so Appearance can switch them.
           The hexes, light and dark, live in src/lib/theme.ts; ThemeProvider
           sets the variables. */
        ...themed("pp", PP_TOKENS),
        ...themed("st", ST_TOKENS),
      },
      borderRadius: {
        card: "1.25rem",
      },
      /* Native fonts are one family per weight, so weights get their own
         utilities (font-sans-bold instead of font-sans font-bold). */
      fontFamily: {
        sans: "Nunito_400Regular",
        "sans-semibold": "Nunito_600SemiBold",
        "sans-bold": "Nunito_700Bold",
        "sans-extrabold": "Nunito_800ExtraBold",
        display: "Fredoka_500Medium",
        "display-semibold": "Fredoka_600SemiBold",

        /* The portals' pairing on the web (app/parent/layout.tsx and
           app/student/layout.tsx): DM Sans for body copy, Poppins for
           display. Sign-in keeps Nunito and Fredoka, as the web's does. */
        pp: "DMSans_400Regular",
        "pp-medium": "DMSans_500Medium",
        "pp-semibold": "DMSans_600SemiBold",
        "pp-bold": "DMSans_700Bold",
        "pp-extrabold": "DMSans_800ExtraBold",
        "pp-display": "Poppins_500Medium",
        "pp-display-semibold": "Poppins_600SemiBold",
        "pp-display-bold": "Poppins_700Bold",
      },
      boxShadow: {
        clay: "0 4px 12px rgba(36, 65, 124, 0.08)",
        "clay-lg": "0 8px 20px rgba(36, 65, 124, 0.12)",
      },
    },
  },
  plugins: [],
};
