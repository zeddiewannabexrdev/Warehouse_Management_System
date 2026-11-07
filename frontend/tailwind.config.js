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
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#151e2e',
          900: '#0f172a',
          925: '#0b1322',
          950: '#020617',
        },
        surface: {
          canvas: '#f8fafc',
          card: '#ffffff',
          muted: '#f1f5f9',
          sidebar: '#0e1726',
          'sidebar-dark': '#0a111c',
        },
        line: {
          subtle: '#e2e8f0',
          strong: '#cbd5e1',
          dark: '#1e293b',
        }
      },
      boxShadow: {
        none: 'none',
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
        full: '9999px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Consolas',
          'Courier New',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}
