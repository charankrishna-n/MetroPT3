/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#1a1d27',
        border: '#2a2d3e',
        accent: '#7c3aed',
        'accent-light': '#a78bfa',
        blue: { 500: '#3b82f6', 400: '#60a5fa' },
        green: { 400: '#4ade80', 500: '#22c55e' },
        yellow: { 400: '#facc15' },
        red: { 400: '#f87171', 500: '#ef4444' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
