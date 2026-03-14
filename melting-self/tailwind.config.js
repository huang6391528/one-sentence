// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glacier-bg': '#0A0F1E',
        'glacier-text': '#A5B4FC',
      }
    },
  },
  plugins: [],
}