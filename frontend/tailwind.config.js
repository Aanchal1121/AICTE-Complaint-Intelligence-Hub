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
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0B1120',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        aicte: {
          navy: '#0F172A',
          accent: '#0E7490',
          cyan: '#06B6D4',
          gold: '#D97706',
          cardDark: '#1E293B',
          surfaceDark: '#0B1120',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px -3px rgba(6, 182, 212, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(6, 182, 212, 0.5)',
        'glow-red': '0 0 25px -4px rgba(239, 68, 68, 0.5)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.5)',
      }
    },
  },
  plugins: [],
}
