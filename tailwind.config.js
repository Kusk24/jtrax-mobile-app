/** @type {import('tailwindcss').Config} */
// Palette copied from jtrax-web-app main (app/globals.css @theme).
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#f7f4ee",
        card: "#fffdfa",
        navy: "#2b4380",
        "navy-deep": "#1f3567",
        "navy-soft": "#d9e0ef",
        ink: "#2b2b2b",
        muted: "#8a8a86",
        line: "#e4e0d8",
        brick: "#c0392b",
        "brick-soft": "#f6d7ce",
        maroon: "#7d3c3c",
        olive: "#8fa653",
        "olive-soft": "#dde3c4",
        peach: "#f8e3c9",
        "peach-ink": "#8c3a1e",
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
        clay: "0 4px 12px rgba(43, 67, 128, 0.08)",
        "clay-lg": "0 8px 20px rgba(43, 67, 128, 0.12)",
      },
    },
  },
  plugins: [],
};
