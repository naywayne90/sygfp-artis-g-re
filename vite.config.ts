import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Augmenter la limite d'avertissement pour les gros chunks
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Séparation manuelle des vendors en chunks distincts
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Composants UI Radix
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
          ],

          // React Query (state management)
          'vendor-query': ['@tanstack/react-query'],

          // Formulaires et validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Graphiques
          'vendor-charts': ['recharts'],

          // Export PDF
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],

          // Export Excel
          'vendor-excel': ['xlsx'],

          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],

          // Date utilities
          'vendor-date': ['date-fns'],

          // QR Code
          'vendor-qrcode': ['qrcode.react'],

          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
}));
