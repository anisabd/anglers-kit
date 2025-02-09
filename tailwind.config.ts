
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Nature-inspired palette
        sage: {
          50: "#f4f7f4",
          100: "#e6ede6",
          200: "#cfdccf",
          300: "#a8bfa8",
          400: "#839c83",
          500: "#657e65",
          600: "#4f634f",
          700: "#415041",
          800: "#374137",
          900: "#2f372f",
        },
        water: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#b9e6fe",
          300: "#7cd4fd",
          400: "#36bffa",
          500: "#0ca5e9",
          600: "#0284c7",
          700: "#036ba1",
          800: "#075985",
          900: "#0c4a6e",
        },
        earth: {
          50: "#faf6f3",
          100: "#f3ebe4",
          200: "#e7d6c9",
          300: "#d5b9a3",
          400: "#c19577",
          500: "#b17b59",
          600: "#a0674a",
          700: "#85523d",
          800: "#6d4435",
          900: "#5a392e",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
