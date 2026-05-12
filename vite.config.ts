import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    esbuildOptions: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-core": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],
          "vendor-data": [
            "@tanstack/react-query",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
          "vendor-db": ["@supabase/supabase-js"],
          "vendor-date": ["date-fns"],
          "vendor-xlsx": ["xlsx"],
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
          "vendor-charts": ["recharts"],
        },
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 500,
    cssMinify: true,
    sourcemap: mode === "development",
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "date-fns",
    ],
    exclude: ["lovable-tagger"],
  },
}));
