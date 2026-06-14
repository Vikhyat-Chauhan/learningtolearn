import type { Config } from "tailwindcss";

// The deck's visual identity lives in src/app/globals.css (design tokens + the
// 3D card / forgetting-curve styles). Tailwind here only wires the font CSS
// variables set by next/font so utility classes can reach them if needed.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
