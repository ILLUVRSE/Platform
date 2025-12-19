import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', "Times New Roman", "Times", "serif"],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        background: "#F9F8F6", // Creamy white
        foreground: "#2C3333", // Dark slate text
        primary: "#84A98C", // Sage green
        secondary: "#52796F", // Darker sage
        accent: "#E6B8A2", // Soft peach/terracotta
        paper: "#FFFFFF",
        border: "#D1D5DB",
      },
    },
  },
  plugins: [],
};
export default config;
