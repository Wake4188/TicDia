import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

export default defineConfig(({ mode }) => ({
  // ✅ REQUIRED for Vercel — fixes MIME type + blank screen
  base: "/",

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Reduce overlay noise
    },
  },

  // Optimize dependency pre-bundling for faster dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: ['@lovable-dev/tagger'],
  },

  // Enable caching for faster rebuilds
  cacheDir: 'node_modules/.vite',

  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && deferCSSPlugin(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Ensure all deps use the same React instance (React 19 compatibility)
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    // Dedupe React to prevent multiple instances
    dedupe: ['react', 'react-dom'],
  },

  build: {
    cssCodeSplit: true,
    // Disable sourcemaps in production for faster builds
    sourcemap: false,

    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Core vendor + router together to prevent createContext error
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('react-router')) {
            return 'vendor';
          }
          // Heavy animations - defer load
          if (id.includes('framer-motion') || id.includes('gsap')) {
            return 'animations';
          }
          // Supabase - defer until needed
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // React Query - needed early but can be separate
          if (id.includes('@tanstack')) {
            return 'query';
          }
          // Charts (recharts/d3) — lazy admin only
          if (id.includes('recharts') || id.includes('victory') || id.includes('d3-')) {
            return 'charts';
          }
          // 3D — never on critical path
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three';
          }
          // Maps — only weather page
          if (id.includes('leaflet')) {
            return 'maps';
          }
          // PDF export — only ExportMenu (now lazy)
          if (id.includes('html2canvas') || id.includes('jspdf')) {
            return 'export';
          }
          // Icons — separate cache lane from radix primitives
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('@radix-ui')) {
            return 'radix';
          }
        },
      },
    },

    target: 'esnext',

    // Use esbuild instead of terser - 10x faster minification
    minify: 'esbuild',

    chunkSizeWarningLimit: 1000,
  },

  // Strip console.* and debugger statements in production builds
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
