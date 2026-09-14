import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: {
      executablePath: process.env.CHROME_PATH,
      // Decode and play actual media, without depending on the host audio device.
      // Set E2E_REAL_AUDIO=1 when checking physical audio output manually.
      args:
        process.env.E2E_REAL_AUDIO === "1" ? [] : ["--disable-audio-output"],
    },
    viewport: { width: 1440, height: 1150 },
  },
  webServer: {
    command: "node node_modules/vite/bin/vite.js --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
