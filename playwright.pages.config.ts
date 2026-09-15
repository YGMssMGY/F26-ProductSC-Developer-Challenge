import { defineConfig } from "@playwright/test";
import shared from "./playwright.config";
export default defineConfig({
  ...shared,
  testIgnore: [],
  testMatch: "**/pages.spec.ts",
  use: {
    ...shared.use,
    baseURL: "http://127.0.0.1:4174/F26-ProductSC-Developer-Challenge/",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --mode github-pages --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/F26-ProductSC-Developer-Challenge/",
    reuseExistingServer: false,
  },
});
