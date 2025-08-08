/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mapear tokens para usar via classes Tailwind
        bg: {
          primary: "hsl(var(--color-bg-primary) / <alpha-value>)",
          secondary: "hsl(var(--color-bg-secondary) / <alpha-value>)",
        },
        text: {
          primary: "hsl(var(--color-text-primary) / <alpha-value>)",
          secondary: "hsl(var(--color-text-secondary) / <alpha-value>)",
          muted: "hsl(var(--color-text-muted) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          foreground: "hsl(var(--color-primary-foreground) / <alpha-value>)",
          strong: "hsl(var(--color-primary-strong) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "hsl(var(--color-danger) / <alpha-value>)",
          border: "hsl(var(--color-danger-border) / <alpha-value>)",
        },
        border: {
          DEFAULT: "hsl(var(--color-border) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
}