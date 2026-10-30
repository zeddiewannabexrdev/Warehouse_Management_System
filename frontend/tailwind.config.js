/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d7e9',
          300: '#95b9d9',
          400: '#6196c5',
          500: '#3c79b0',
          600: '#2c6092',
          700: '#1b3f65',
          800: '#153150',
          900: '#10263f',
          950: '#0a1728',
        },
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: [
          'Arial',
          'Helvetica Neue',
          'Helvetica',
          'sans-serif'
        ],
        mono: [
          'Consolas',
          'Courier New',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}
