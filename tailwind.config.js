/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: { 400: '#D4AF37', 500: '#C5A028', 600: '#B8960F' },
        dark: { 800: '#1a1a2e', 900: '#0f0f1a', 950: '#0a0a12' }
      }
    }
  },
  plugins: []
};
