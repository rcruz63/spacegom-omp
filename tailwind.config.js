/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#0a0d14',
          800: '#111726',
          700: '#1b233a',
          600: '#2a3656',
          500: '#3e4f7a',
          accent: '#38bdf8',
          gold: '#fbbf24',
          danger: '#ef4444',
          success: '#22c55e'
        }
      }
    },
  },
  plugins: [],
}
