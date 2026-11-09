// Rulează Supabase CLI cu contul firmei: cheia de acces și proiectul vin din .env.local (proiectul de test).
// Folosire: npm run sb -- <comandă> (de ex. npm run sb -- db push --remote)
// Pentru producție: SB_MEDIU=productie npm run sb -- … (citește .env.productie.local, cu tokenul proiectului de producție)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const fisier = process.env.SB_MEDIU === "productie" ? ".env.productie.local" : ".env.local";
if (!existsSync(fisier)) {
  console.error(`Lipsește ${fisier}.`);
  process.exit(1);
}
process.loadEnvFile(fisier);
const r = spawnSync("npx", ["supabase", ...process.argv.slice(2)], { stdio: "inherit", shell: true, env: process.env });
process.exit(r.status ?? 1);
