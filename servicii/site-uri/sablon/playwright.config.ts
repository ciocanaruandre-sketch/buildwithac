import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3300" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // cu `npm run dev` deja pornit pe 3300, testele îl folosesc pe acela
  webServer: { command: "npm run dev", port: 3300, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
