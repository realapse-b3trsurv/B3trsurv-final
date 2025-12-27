import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      // Fallback for the shared folder
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  // --- THE FIX IS HERE ---
  define: {
    // This tells the phone: "You are the global computer now."
    global: "window",
  },
});
