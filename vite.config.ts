import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "github-pages" ? "/F26-ProductSC-Developer-Challenge/" : "/",
  // Test the Pages build without a server-side SPA fallback.
  appType: mode === "github-pages" ? "mpa" : "spa",
}));
