/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f9fb',
          100: '#edf2f7',
          200: '#dbe7f1',
          300: '#c2d6e6',
          400: '#9fbdd6',
          500: '#6f9cc1',
          600: '#4f7fa8',
          700: '#3f678a',
          800: '#345271',
          900: '#2c455e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
