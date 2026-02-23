/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8D48B',
        dark: '#0A0A0F',
        'dark-surface': '#12121A',
        'dark-card': '#1A1A26',
      }
    }
  },
  plugins: []
};
