import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  server: {
    port: 5000,
    host: '0.0.0.0',
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    allowedHosts: [
      'c765a819-5dd8-4753-b950-59839be37206-00-2tkq221czoll.spock.replit.dev', // Host bloqueado
      'localhost', // Si necesitas otros hosts locales
      '0.0.0.0', // Para permitir todas las conexiones desde cualquier dirección
    ],
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
});
