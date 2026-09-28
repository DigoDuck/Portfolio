// Cores em OKLCH vindas das variáveis de index.css. O formato "L C H" nas
// variáveis permite os modificadores de opacidade do Tailwind (bg-ink/40).
const token = (name) => `oklch(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        ink: token("ink"),
        muted: token("muted"),
        rule: token("rule"),
        signal: token("signal"),
        "on-signal": token("on-signal"),
      },
      fontFamily: {
        sans: ["Schibsted Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        lead: ["clamp(1.125rem, 1rem + 0.5vw, 1.375rem)", { lineHeight: "1.55" }],
        title: [
          "clamp(1.75rem, 1.35rem + 1.6vw, 2.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ],
        display: [
          "clamp(2.75rem, 1.5rem + 5.2vw, 5.75rem)",
          { lineHeight: "0.95", letterSpacing: "-0.035em" },
        ],
      },
      transitionTimingFunction: {
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};
