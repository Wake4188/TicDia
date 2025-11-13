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
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'radix-base': ['@radix-ui/react-slot', '@radix-ui/react-avatar', '@radix-ui/react-label'],
          'radix-forms': ['@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-select', '@radix-ui/react-switch'],
        },
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console in production
        drop_debugger: true,
        passes: 2, // More aggressive minification
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
  },
}));
