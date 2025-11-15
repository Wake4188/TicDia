import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Enhanced plugin to defer CSS loading and eliminate render blocking
const deferCSSPlugin = (): Plugin => ({
  name: 'defer-css',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      // Transform blocking CSS links to non-blocking preload
      return html.replace(
        /<link([^>]*?)rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*?)>/gi,
        (match, before, middle, href, after) => {
          // Skip Google Fonts - they're already optimized
          if (href.includes('fonts.googleapis')) {
            return match;
          }
          
          // Use rel="preload" for non-blocking load with proper fallback
          return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
                 `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
        }
      );
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    mode === 'production' && deferCSSPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    sourcemap: true, // Enable source maps for production debugging
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Aggressive code splitting for better caching and reduced unused JS
          if (id.includes('node_modules')) {
            // Core React - always needed
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // Router - only needed when navigating
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Animation library - defer for better initial load
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // UI components split by usage pattern
            if (id.includes('@radix-ui')) {
              if (id.includes('dialog') || id.includes('dropdown') || id.includes('popover') || id.includes('sheet')) {
                return 'radix-overlays';
              }
              if (id.includes('form') || id.includes('checkbox') || id.includes('select') || id.includes('slider')) {
                return 'radix-forms';
              }
              return 'radix-base';
            }
            // Data fetching - separate for better caching
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Backend client
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Icons - large library, split separately
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Charts - only needed on specific pages
            if (id.includes('recharts')) {
              return 'charts';
            }
            // Other large libraries
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            // Remaining vendor code
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        passes: 3, // More aggressive minification
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
