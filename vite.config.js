import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    open: true
  },
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize dependencies
    rollupOptions: {
      output: {
        // Separate vendor chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'antd-vendor': ['antd'],
          'framer-motion': ['framer-motion'],
          'pdf-vendor': ['jspdf']
        }
      }
    }
  }
});