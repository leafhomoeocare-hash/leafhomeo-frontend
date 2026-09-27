/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary color - Sage Green (#64a281)
          50: '#f2f8f5',
          100: '#e6f0e9',
          200: '#cce1d4',
          300: '#99d2be',
          400: '#64a281',
          500: '#64a281',
          600: '#528f6e',
          700: '#3f735a',
          800: '#2c5746',
          900: '#1a3b32',
          // Secondary color - Dark Teal (#145656)
          'secondary-50': '#e8f4f4',
          'secondary-100': '#d2e9e9',
          'secondary-200': '#a5d3d3',
          'secondary-300': '#78bdbd',
          'secondary-400': '#4ba7a7',
          'secondary-500': '#145656',
          'secondary-600': '#0f4444',
          'secondary-700': '#0a3232',
          'secondary-800': '#052020',
          'secondary-900': '#021010',
          // Legacy colors for compatibility
          dark: '#145656',
          primary: '#64a281',
          hover: '#528f6e',
          light: '#e6f0e9',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}