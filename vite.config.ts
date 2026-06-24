import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve([import.me](https://import.me)ta.dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["@anthropic-ai/sdk"],
    },
  },
});