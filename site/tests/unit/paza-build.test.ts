import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";

// `npm run build` pornește întâi `prebuild`: pe Vercel, în producție, un ghid stricat oprește build-ul
const ruleaza = (env: Record<string, string | undefined>) =>
  spawnSync("npx", ["tsx", "scripts/verifica-ghid.ts", "--productie"], { encoding: "utf-8", shell: true, env: { ...process.env, VERCEL_ENV: undefined, ...env } });

describe("verifica --productie (prebuild)", () => {
  it("în afara producției sare peste verificare", () => {
    const r = ruleaza({});
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("verifica: sar, nu e producție");
  });

  it("în producție verifică ghidurile adevărate", () => {
    const r = ruleaza({ VERCEL_ENV: "production" });
    expect(r.stdout).toContain("harvey-agent-clienti: 0 erori");
    expect(r.status).toBe(0);
  }, 30_000);
});
