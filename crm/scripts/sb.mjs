// Rulează Supabase CLI cu contul firmei: cheia de acces și proiectul vin din .env.local.
// Folosire: npm run sb -- <comandă> (de ex. npm run sb -- db push)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const r = spawnSync("npx", ["supabase", ...process.argv.slice(2)], { stdio: "inherit", shell: true, env: process.env });
process.exit(r.status ?? 1);
