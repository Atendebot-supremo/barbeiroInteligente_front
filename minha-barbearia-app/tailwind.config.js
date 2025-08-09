/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapear tokens para usar via classes Tailwind (variáveis em HEX/rgb completos)
        bg: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          whiteMuted: "var(--color-text-white-muted)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
          strong: "var(--color-primary-strong)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          border: "var(--color-danger-border)",
        },
        border: {
          DEFAULT: "var(--color-border)",
        },
      },
    },
  },
  plugins: [],
}