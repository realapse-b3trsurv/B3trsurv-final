import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      // THIS IS THE FIX: Converts 'require' to valid browser code
      transformMixedEsModules: true, 
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          dapp: ['@vechain/dapp-kit', '@vechain/dapp-kit-react'],
        },
      },
    },
  },
  define: {
    global: "window",
  },
});
