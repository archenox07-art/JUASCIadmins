import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        panel: "#0C1222",
        card: "#0F1729",
        border: "#1A2540",
        text: "#E2E0DC",
        "stellar-gold": "#C9A84C",
        "nebula-violet": "#A78BFA",
        "solar-flare": "#E87565",
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
