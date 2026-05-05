import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'engines': [
            './src/validation_engine/FormValidationEngine.js',
            './src/filing_guide/FilingGuideGenerator.js',
            './src/audit/AuditReportGenerator.js',
            './src/assembly/DocumentAssemblyEngine.js'
          ],
          'infrastructure': [
            './src/persistence/PersistenceManager.js',
            './src/export/ExportEngine.js',
            './src/a11y/AccessibilityManager.js',
            './src/platform/PlatformIntegrationRouter.js',
            './src/data/DataLayerConnector.js'
          ],
          'platform': [
            './src/platform/PlatformContext.jsx',
            './src/platform/ModuleConnector.js',
            './src/platform/useVERNEN.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
