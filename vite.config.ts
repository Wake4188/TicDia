import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// Plugin to defer CSS loading for better performance
const deferCSSPlugin = (): Plugin => ({
  name: 'defer-css',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      // Transform blocking CSS links to preload with deferred loading
      return html.replace(
        /<link([^>]*?)rel="stylesheet"([^>]*?)>/gi,
        (match, before, after) => {
          const href = match.match(/href="([^"]+)"/)?.[1];
          if (href && href.includes('.css')) {
            return `<link${before}rel="preload"${after} as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link${before}rel="stylesheet"${after}></noscript>`;
          }
          return match;
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
          // More aggressive code splitting for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@radix-ui')) {
              if (id.includes('dialog') || id.includes('dropdown') || id.includes('popover')) {
                return 'radix-overlays';
              }
              if (id.includes('form') || id.includes('checkbox') || id.includes('select')) {
                return 'radix-forms';
              }
              return 'radix-base';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Split other large libraries individually
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
