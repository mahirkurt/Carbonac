import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules'],
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'if-function']
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Backend API server defaults to PORT=3001 (see backend/server.js)
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  preview: {
    proxy: {
      '/api': {
        // Keep /api working in `vite preview` too (otherwise SPA fallback returns index.html)
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
