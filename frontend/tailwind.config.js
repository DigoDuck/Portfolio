/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          600: "#0284c7",
          900: "#0c4a6e",
        },
        surface: {
          light: "#f8fafc",
          dark: "#0f172a",
        },
        paleta: {
          1: '#d4cdc5',
          2: '#5b88a5',
          3: '#f4f4f2',
          4: '#191013',
          5: '#243a69',
        },
        brand: {
          beige: '#d4cdc5',
          blue:  '#5b88a5',
          white: '#f4f4f2',
          dark:  '#191013',
          navy:  '#243a69',
        },
      },
      fontFamily: {
        sans: ["Prompt Regular", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 14s linear infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradient: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};