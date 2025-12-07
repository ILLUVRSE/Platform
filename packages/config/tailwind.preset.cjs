/** Shared Tailwind preset for ILLUVRSE apps */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: "#0f2d2f",
        teal: {
          500: "#2bb4a8",
          600: "#1f8f86"
        },
        gold: {
          400: "#d8a048",
          500: "#c48726"
        },
        cream: "#f4eee2",
        slate: {
          800: "#0c161a",
          700: "#122127",
          600: "#1b2f36",
          500: "#2b3f46",
          200: "#c8d5d8"
        }
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      boxShadow: {
        card: "0 10px 40px rgba(0,0,0,0.25)"
      },
      borderRadius: {
        xl: "18px",
        "2xl": "26px"
      }
    }
  }
};
