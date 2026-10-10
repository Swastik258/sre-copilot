import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base — deep neutral charcoal, not pure black
        ink: {
          950: "#0a0a0b",
          900: "#0d0d0f",
          850: "#121214",
          800: "#17171a",
          700: "#1f1f23",
          600: "#2a2a30",
          500: "#3a3a42",
        },
        // Text
        paper: {
          50: "#f5f3ee",
          100: "#e8e5dd",
          200: "#c9c5bb",
          300: "#9a968c",
          400: "#6b6a63",
        },
        // Single accent — amber
        amber: {
          300: "#f0c674",
          400: "#e8b95c",
          500: "#e0a94a",
          600: "#c8902f",
          700: "#a67521",
        },
        // Status colors (used sparingly, only for state indicators)
        signal: {
          good: "#5cc98a",
          warn: "#e0a94a",
          bad: "#e5534b",
          idle: "#4a4a52",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Editorial headline sizes
        "display-sm": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display": ["3rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-lg": ["4rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-xl": ["5rem", { lineHeight: "1.0", letterSpacing: "-0.035em" }],
        // Small-caps section label
        "label": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.14em" }],
        // Dense body
        "dense": ["0.8125rem", { lineHeight: "1.55" }],
        "dense-lg": ["0.875rem", { lineHeight: "1.6" }],
      },
      borderColor: {
        DEFAULT: "#1f1f23",
        hairline: "#1a1a1e",
        "hairline-strong": "#26262c",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
      maxWidth: {
        prose: "42rem",
        editorial: "58rem",
        wide: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;