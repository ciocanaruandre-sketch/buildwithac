import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "mobil", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }, testIgnore: /demo15/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /demo15/ },
  ],
  webServer: [{ command: "npm run dev -- --port 3000", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 }],
});
