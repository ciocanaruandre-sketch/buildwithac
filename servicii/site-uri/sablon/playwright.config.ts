import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3300" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm run dev", port: 3300, reuseExistingServer: false, timeout: 120_000 },
});
