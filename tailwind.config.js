/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kirana: {
          50: '#f2fbf6',
          100: '#e1f7ec',
          200: '#c5eed9',
          300: '#97debE',
          400: '#62c69d',
          500: '#3ba97f',
          600: '#2c8965',
          700: '#256d53',
          800: '#215743',
          900: '#1d4838',
          950: '#0b291f',
        },
        khata: {
          50: '#fdfbf7',
          100: '#f9f5ec',
          200: '#f2e8d5',
          300: '#e8d4b3',
          400: '#dcbc8d',
          500: '#d1a46b',
          600: '#c48f57',
          700: '#a37145',
          800: '#845b3c',
          900: '#6c4b34',
        }
      },
    },
  },
  plugins: [],
}
