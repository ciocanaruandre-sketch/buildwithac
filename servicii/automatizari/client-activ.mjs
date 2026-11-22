#!/usr/bin/env node
// Leagă serverul `n8n-mcp` de n8n-ul unui singur client, prin `.mcp.json` (ignorat de git).
// Fără N8N_API_KEY (planul B), leagă direct MCP-ul oficial al clientului, cu tokenul Member-ului.
//   node servicii/automatizari/client-activ.mjs <slug>      → serverul n8n-<slug>, cu cheile clientului
//   node servicii/automatizari/client-activ.mjs --niciunul  → doar n8n-docs (documentația nodurilor, fără chei)
// Cheile stau în clienti/<slug>/automatizari/.chei.env (ignorat de git), scrise de Andrei.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { valideazaSlug } from "../site-uri/porneste.mjs";

const CHEI_PERMISE = ["N8N_API_URL", "N8N_API_KEY", "N8N_MCP_ACCESS_TOKEN"];

/** Citește un fișier `CHEIE=valoare` (`#` = comentariu) și verifică cheile obligatorii. */
export function citesteChei(text) {
  const chei = {};
  for (const rand of text.split(/\r?\n/)) {
    const r = rand.trim();
    if (!r || r.startsWith("#")) continue;
    const egal = r.indexOf("=");
    if (egal < 0) continue;
    const cheie = r.slice(0, egal).trim();
    if (CHEI_PERMISE.includes(cheie)) chei[cheie] = r.slice(egal + 1).trim();
  }
  if (!chei.N8N_API_URL) throw new Error("Lipsește N8N_API_URL (sau e goală) în fișierul de chei.");
  // planul B: fără cheie API, doar tokenul MCP-ului oficial
  if (!chei.N8N_API_KEY && !chei.N8N_MCP_ACCESS_TOKEN) {
    throw new Error("Lipsește N8N_API_KEY (sau e goală) în fișierul de chei. Fără ea, pune măcar N8N_MCP_ACCESS_TOKEN (planul B).");
  }
  if (!chei.N8N_API_URL.startsWith("https://")) {
    throw new Error(`N8N_API_URL trebuie să înceapă cu https:// (acum: „${chei.N8N_API_URL}”).`);
  }
  chei.N8N_API_URL = chei.N8N_API_URL.replace(/\/+$/, "");
  for (const k of ["N8N_API_KEY", "N8N_MCP_ACCESS_TOKEN"]) if (chei[k] === "") delete chei[k];
  return chei;
}

const ENV_COMUN = { MCP_MODE: "stdio", LOG_LEVEL: "error", DISABLE_CONSOLE_OUTPUT: "true" };

/** Serverul fără chei: doar documentația nodurilor și validarea. */
export function serverDocumentatie() {
  return { command: "npx", args: ["-y", "n8n-mcp"], env: { ...ENV_COMUN } };
}

/** Serverul legat de n8n-ul unui client. Fără cheie API (planul B): direct MCP-ul oficial al instanței, prin HTTP. */
export function serverClient(chei) {
  if (!chei.N8N_API_KEY) {
    return { type: "http", url: `${chei.N8N_API_URL}/mcp-server/http`, headers: { Authorization: `Bearer ${chei.N8N_MCP_ACCESS_TOKEN}` } };
  }
  const env = { ...ENV_COMUN, N8N_API_URL: chei.N8N_API_URL, N8N_API_KEY: chei.N8N_API_KEY };
  if (chei.N8N_MCP_ACCESS_TOKEN) env.N8N_MCP_ACCESS_TOKEN = chei.N8N_MCP_ACCESS_TOKEN;
  return { command: "npx", args: ["-y", "n8n-mcp"], env };
}

/** Scrie `.mcp.json` cu serverele non-n8n neatinse și un singur server n8n. */
function scrieMcp(radacina, nume, server) {
  const cale = join(radacina, ".mcp.json");
  const vechi = existsSync(cale) ? JSON.parse(readFileSync(cale, "utf8")) : {};
  const servere = {};
  for (const [n, s] of Object.entries(vechi.mcpServers || {})) {
    if (!n.startsWith("n8n-")) servere[n] = s;
  }
  servere[nume] = server;
  writeFileSync(cale, JSON.stringify({ ...vechi, mcpServers: servere }, null, 2) + "\n");
}

/** Face activ clientul `slug`. Întoarce numele serverului. Nu atinge nimic dacă ceva nu e în regulă. */
export function activeaza({ radacina, slug }) {
  const greseala = valideazaSlug(slug);
  if (greseala) throw new Error(greseala);
  const caleChei = join(radacina, "clienti", slug, "automatizari", ".chei.env");
  if (!existsSync(caleChei)) {
    throw new Error(`Nu găsesc cheile clientului în ${caleChei}. Andrei le scrie acolo (fișierul .chei.env nu intră în git).`);
  }
  const chei = citesteChei(readFileSync(caleChei, "utf8"));
  const nume = `n8n-${slug}`;
  scrieMcp(radacina, nume, serverClient(chei));
  return nume;
}

/** Niciun client activ: rămâne doar n8n-docs. */
export function dezactiveaza({ radacina }) {
  scrieMcp(radacina, "n8n-docs", serverDocumentatie());
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  const radacina = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  try {
    if (!arg) throw new Error("Folosire: node servicii/automatizari/client-activ.mjs <slug> | --niciunul");
    if (arg === "--niciunul") {
      dezactiveaza({ radacina });
      console.log("Niciun client activ: doar n8n-docs. Repornește sesiunea Claude (sau /mcp → Reconnect) ca să se încarce.");
    } else {
      const nume = activeaza({ radacina, slug: arg });
      console.log(`Activ: ${nume}. Repornește sesiunea Claude (sau /mcp → Reconnect) ca să se încarce.`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
