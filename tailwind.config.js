/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vernen: {
          gold: '#D4AF37',
          dark: '#0A0A0F',
          panel: '#12121A',
          border: '#1E1E2E',
          text: '#E8E8ED',
          muted: '#8888AA'
        }
      }
    }
  },
  plugins: []
};
