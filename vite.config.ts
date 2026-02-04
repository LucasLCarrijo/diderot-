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
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components  
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          // Data layer
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          // Charts (lazy loaded pages only)
          'charts': ['recharts'],
          // Export tools (lazy loaded)
          'export-tools': ['jspdf', 'jspdf-autotable', 'xlsx'],
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
