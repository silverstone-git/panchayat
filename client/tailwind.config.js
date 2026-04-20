/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
          "colors": {
              "primary": "var(--primary)",
              "on-primary": "var(--on-primary)",
              "surface": "var(--surface)",
              "on-surface": "var(--on-surface)",
              "surface-container-lowest": "var(--surface-container-lowest)",
              "surface-container-low": "var(--surface-container-low)",
              "surface-container": "var(--surface-container)",
              "surface-container-high": "var(--surface-container-high)",
              "surface-container-highest": "var(--surface-container-highest)",
              "on-surface-variant": "var(--on-surface-variant)",
              "outline-variant": "var(--outline-variant)",
              "secondary-container": "var(--secondary-container)",
              "on-secondary-container": "var(--on-secondary-container)",
              "tertiary-container": "var(--tertiary-container)",
              "on-tertiary-container": "var(--on-tertiary-container)",
              "primary-container": "var(--primary-container)",
              "tertiary-fixed": "#ffdbcf", // fallback static
              "tertiary-fixed-dim": "#ffb59a",
              "secondary-fixed": "#cbe7f5",
              "secondary-fixed-dim": "#afcbd8",
          },
          "borderRadius": {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
          },
          "fontFamily": {
              "headline": ["Public Sans", "sans-serif"],
              "body": ["Manrope", "sans-serif"],
              "label": ["Inter", "sans-serif"]
          }
      },
  },
  plugins: [],
}
