import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "mobil", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }, testIgnore: /demo15/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /demo15/ },
    // al doilea server, cu 15 ghiduri de exemplu (DEMO_GHIDURI), în alt dosar de build
    { name: "demo15", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, baseURL: "http://localhost:3001" }, testMatch: /demo15/ },
  ],
  webServer: [
    { command: "npm run dev -- --port 3000", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
    { command: "npm run dev -- --port 3001", url: "http://localhost:3001", reuseExistingServer: true, timeout: 120_000, env: { DEMO_GHIDURI: "15", NEXT_DIST_DIR: ".next-demo" } },
  ],
});
