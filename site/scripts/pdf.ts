// npm run pdf -- <slug> [--url http://localhost:3000]
// Fără --url: build separat (.next-pdf) + server pe portul 3003, oprit la final.
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { SITE } from "@/lib/config";
import { incarcaGhiduri } from "@/lib/ghiduri";
import { numePdf, tiparesteGhid } from "./pdf/tipar";

const PORT = 3003;
const mediu = { ...process.env, NEXT_DIST_DIR: ".next-pdf" };

function opreste(server: ChildProcess) {
  if (!server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill();
}

async function asteapta(url: string) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch { /* încă pornește */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Serverul de pe ${url} n-a pornit în 60 de secunde.`);
}

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  const iUrl = rest.indexOf("--url");
  const bazaData = iUrl >= 0 ? rest[iUrl + 1] : undefined;
  if (!slug) throw new Error("Lipsește slug-ul: npm run pdf -- <slug>");
  const g = incarcaGhiduri(undefined, { productie: false }).find((x) => x.slug === slug);
  if (!g) throw new Error(`Nu există ghidul „${slug}” în content/ghiduri/.`);

  let server: ChildProcess | undefined;
  const baza = bazaData ?? `http://localhost:${PORT}`;
  if (!bazaData) {
    console.log("Build pentru PDF (un minut sau două)…");
    const build = spawnSync("next build", { shell: true, stdio: "inherit", env: mediu });
    if (build.status !== 0) throw new Error("Build-ul a eșuat.");
    server = spawn(`next start -p ${PORT}`, { shell: true, stdio: "ignore", env: mediu });
  }

  try {
    await asteapta(`${baza}/ghiduri/${slug}`);
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
      const pdf = await tiparesteGhid(page, `${baza}/ghiduri/${slug}`);
      const dosar = path.join(process.cwd(), "public", "pdf");
      fs.mkdirSync(dosar, { recursive: true });
      const nume = numePdf(slug, fs.readdirSync(dosar));
      fs.writeFileSync(path.join(dosar, nume), pdf);
      console.log(`\n✓ public/pdf/${nume} (${Math.round(pdf.length / 1024)} KB)`);
      console.log(`Link-ul pentru Instagram: ${SITE.url}/pdf/${nume}`);
      if (!g.pdf) console.log(`! În content/ghiduri/${slug}/index.mdx schimbă pdf: false în pdf: true.`);
    } finally {
      await browser.close();
    }
  } finally {
    if (server) opreste(server);
  }
}

main().catch((e) => {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
});
