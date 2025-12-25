import type { Config } from "tailwindcss";
import sharedPreset from "../../packages/config/tailwind.preset.cjs";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/food/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/gridstock/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/news/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
