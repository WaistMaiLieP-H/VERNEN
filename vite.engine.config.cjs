const react = require('@vitejs/plugin-react');

module.exports = {
  plugins: [react()],
  build: {
    outDir: 'dist-engine',
    rollupOptions: {
      input: 'engine.html'
    }
  }
};
