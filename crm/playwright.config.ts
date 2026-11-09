import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: { command: "npm run dev -- --port 3100", url: "http://localhost:3100/intra", reuseExistingServer: true, timeout: 120_000 },
});
