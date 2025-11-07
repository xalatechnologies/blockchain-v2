import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0066CC",
          dark: "#0052A3",
          light: "#3385D6",
        },
        accent: {
          DEFAULT: "#FFB81C",
          dark: "#CC9400",
          light: "#FFC84D",
        },
        success: "#28A745",
        warning: "#FF9800",
        error: "#DC3545",
        background: "#F8F9FA",
        foreground: "#212529",
        border: "#E0E0E0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

