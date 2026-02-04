import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de build
    target: 'es2020',
    rollupOptions: {
      output: {
        // Code splitting por vendor
        manualChunks: {
          // React core - always needed
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components - used on most pages
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          // Data layer - needed for API calls
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Note: recharts, jspdf, xlsx are NOT listed here
          // They use dynamic imports and will be code-split automatically
        },
      },
    },
    // Aumenta warning para 1MB
    chunkSizeWarningLimit: 1000,
  },
  // Esbuild minification (default, mais rápido e compatível)
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
