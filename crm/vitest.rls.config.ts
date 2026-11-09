import { defineConfig } from "vitest/config";
import path from "node:path";

// Testele de permisiuni rulează pe proiectul Supabase de TEST, cu utilizatorii reali din seed.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/gol.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    setupFiles: ["./tests/rls/mediu.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
