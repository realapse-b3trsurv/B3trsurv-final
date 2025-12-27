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
    // 1. FIX: Increase limit to 2000kb so the warning disappears
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      output: {
        manualChunks: {
          // 2. Optimization: Split the heavy crypto libraries
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
