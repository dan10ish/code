import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/pyodide": {
        target: "https://cdn.jsdelivr.net",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pyodide/, ""),
      },
    },
  },
  optimizeDeps: {
    exclude: ["pyodide"],
  },
});
