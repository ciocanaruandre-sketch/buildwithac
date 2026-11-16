import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
// o cheie doar pentru teste, dacă .env.local n-are una: serverul și testele criptează cu aceeași
process.env.GOOGLE_CHEIE_CRIPTARE ??= "dGVzdGUtZTJlLWNoZWllLWRlLTMyLWRlLW9jdGV0aSE=";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    { command: "node tests/e2e/google-fals.mjs", url: "http://localhost:3199/__sanatate", reuseExistingServer: true, timeout: 20_000 },
    {
      command: "npm run dev -- --port 3100",
      url: "http://localhost:3100/intra",
      reuseExistingServer: true,
      timeout: 120_000,
      // Google-ul fals (tests/e2e/google-fals.mjs): testele nu vorbesc niciodată cu Google-ul adevărat
      env: {
        ...(process.env as Record<string, string>),
        GOOGLE_API_URL: "http://localhost:3199",
        GOOGLE_TOKEN_URL: "http://localhost:3199/token",
        GOOGLE_REVOKE_URL: "http://localhost:3199/revoke",
        GOOGLE_CLIENT_ID: "fals",
        GOOGLE_CLIENT_SECRET: "fals",
      },
    },
  ],
});
