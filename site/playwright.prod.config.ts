import { defineConfig, devices } from "@playwright/test";

// build-ul de producție (VERCEL_ENV=production): ghidurile de exemplu sunt excluse.
// Prinde ce nu apare în `next dev` — rulează cu `npm run e2e:prod`.
export default defineConfig({
  testDir: "./tests/prod",
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3002" },
  projects: [
    { name: "mobil", use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run build && npm run start -- --port 3002",
    url: "http://localhost:3002",
    reuseExistingServer: false,
    timeout: 300_000,
    env: { VERCEL_ENV: "production", NEXT_DIST_DIR: ".next-prod" },
  },
});
