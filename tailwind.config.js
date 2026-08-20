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
