/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@felipechandiadev/ui/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {
      spacing: {
        page: 'var(--page-gutter)',
      },
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        active: 'var(--color-active)',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          '20': 'rgba(162, 185, 69, 0.2)',
          '30': 'rgba(162, 185, 69, 0.3)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        success: 'var(--color-success)',
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        neutral: 'var(--color-neutral)',
        link: 'var(--color-link)',
      },
    },
  },
  plugins: [],
}


