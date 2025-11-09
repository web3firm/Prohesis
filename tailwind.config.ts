import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        magenta: {
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
        },

        // 🌗 Global palette
        background: {
          light: "#f9fafb",
          dark: "#1a0b2e",
        },
        foreground: {
          light: "#111827",
          dark: "#f9fafb",
        },
      },

      backgroundColor: {
        glass: "rgba(255, 255, 255, 0.7)",
        "glass-dark": "rgba(15, 23, 42, 0.6)",
      },

      backdropBlur: {
        xs: "2px",
      },

      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)",
        card: "0 8px 30px rgba(0,0,0,0.08)",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(168,85,247,0.4)" },
          "50%": { boxShadow: "0 0 10px 4px rgba(168,85,247,0.4)" },
        },
        rotateIn: {
          "0%": { transform: "rotate(-90deg)", opacity: "0" },
          "100%": { transform: "rotate(0deg)", opacity: "1" },
        },
        wave: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },

      animation: {
        fadeIn: "fadeIn 0.6s ease-in-out",
        pulseGlow: "pulseGlow 2s infinite ease-in-out",
        rotateIn: "rotateIn 0.4s ease-out",
        wave: "wave 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
