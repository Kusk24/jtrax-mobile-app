/** @type {import('tailwindcss').Config} */
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

        /* Parent portal — copied from the web app's @theme block, same names.
           A separate family from the student tokens above on purpose: the two
           portals were designed apart and the parent screens port across
           verbatim only while the token names match.

           Light values only. The web shell switches these per the account's
           theme_preference; this app has no dark theme yet, so pinning the
           light set is honest — half a dark theme is worse than none. */
        "pp-ink": "#1a2b4a",
        "pp-blue": "#2e5cb8",
        "pp-deep": "#234a9f",
        "pp-navy": "#1e3a70",
        "pp-line": "#e7ebf3",
        "pp-soft": "#e8eefa",
        "pp-mist": "#f0f4fc",
        "pp-bg": "#fafbfd",
        "pp-card": "#ffffff",
        "pp-panel": "#e8edf8",
        /* De-emphasis and status inks are checked against the tinted panels
           they sit on, not against white — see the web app's note. */
        "pp-muted": "#525d78",
        "pp-faint": "#5a6b8c",
        "pp-sub": "#4a5578",
        "pp-green": "#2e7350",
        "pp-green-soft": "#e6f4ec",
        "pp-green-dot": "#33734d",
        "pp-red": "#b83f3a",
        "pp-red-soft": "#fbeaea",
        "pp-amber": "#8f5410",
        "pp-amber-soft": "#fbeedf",
        "pp-danger": "#a83b3b",
        "pp-danger-soft": "#fdece0",
        "pp-danger-line": "#e7c9c9",
        "pp-plum-soft": "#efeefa",
        "pp-track": "#f3e6d8",
        "pp-bar-track": "#dbe6f7",
        "pp-neutral": "#eef1f7",
        "pp-dash": "#d5cdbd",
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
      },
      boxShadow: {
        clay: "0 4px 12px rgba(36, 65, 124, 0.08)",
        "clay-lg": "0 8px 20px rgba(36, 65, 124, 0.12)",
      },
    },
  },
  plugins: [],
};
