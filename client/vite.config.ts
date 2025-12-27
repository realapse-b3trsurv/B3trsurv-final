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
  define: {
    // Double-check fix for global
    global: "window",
  },
  // This fixes the "Large File" warning
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor files into their own chunk
          vendor: ['react', 'react-dom', 'wouter'],
          // Split heavy crypto stuff
          vechain: ['@vechain/dapp-kit', '@vechain/dapp-kit-react'],
        },
      },
    },
  },
});
