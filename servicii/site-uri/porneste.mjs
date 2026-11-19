#!/usr/bin/env node
/**
 * Pornește site-ul unui client din șablon:
 *   node servicii/site-uri/porneste.mjs <slug> "<Numele firmei>" [domeniu]
 * Copiază servicii/site-uri/sablon/ în clienti/<slug>/site/cod/, pune numele, slug-ul și domeniul
 * și face acolo un depozit git nou, separat de buildwithac. Nu suprascrie niciodată un client existent.
 * Doar module Node, fără dependențe.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Ce nu se copiază din șablon: dependențele și ce produc build-ul și testele. */
const SARITE = new Set(["node_modules", ".next", "test-results", "playwright-report"]);
/** Fișierele în care stau marcajele __NUME_FIRMA__, __SLUG__, __DOMENIU__. */
const CU_MARCAJE = ["lib/config.ts", "package.json", "CLAUDE.md"];

/** „Cafeneaua Colț” → „cafeneaua-colt”. */
export function propuneSlug(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** null dacă slug-ul e bun; altfel ce e greșit și ce să folosești în loc. */
export function valideazaSlug(slug) {
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const propus = propuneSlug(slug);
  return `Slug-ul „${slug}” nu merge: doar litere mici fără diacritice, cifre și cratime.${
    propus ? ` Folosește „${propus}”.` : ""
  }`;
}

/** O valoare din configurarea git văzută din `dir`, sau null dacă nu e pusă. */
function configGit(dir, cheie) {
  try {
    return execFileSync("git", ["-C", dir, "config", cheie], { encoding: "utf8", stdio: "pipe" }).trim() || null;
  } catch {
    return null;
  }
}

export function porneste({ radacina, slug, nume, domeniu }) {
  const greseala = valideazaSlug(slug);
  if (greseala) throw new Error(greseala);
  if (!nume || !nume.trim()) throw new Error("Lipsește numele firmei.");
  domeniu = domeniu || `${slug}.ro`;

  const sablon = join(radacina, "servicii", "site-uri", "sablon");
  const dest = join(radacina, "clienti", slug, "site", "cod");
  if (!existsSync(sablon)) throw new Error(`Nu găsesc șablonul în ${sablon}.`);
  if (existsSync(dest)) throw new Error(`Site-ul clientului există deja în ${dest}. Nu suprascriu nimic.`);

  cpSync(sablon, dest, {
    recursive: true,
    filter: (sursa) => {
      const nume = basename(sursa);
      return !SARITE.has(nume) && !nume.endsWith(".tsbuildinfo");
    },
  });

  for (const f of CU_MARCAJE) {
    const cale = join(dest, f);
    if (!existsSync(cale)) continue;
    // în cod, numele intră ca șir JSON (ghilimelele din „Salon "Bella"” nu strică fișierul);
    // funcțiile de înlocuire opresc interpretarea lui „$&” și a celorlalte tipare cu $
    const text = readFileSync(cale, "utf8")
      .replaceAll('"__NUME_FIRMA__"', () => JSON.stringify(nume.trim()))
      .replaceAll("__NUME_FIRMA__", () => nume.trim())
      .replaceAll("__SLUG__", () => slug)
      .replaceAll("__DOMENIU__", () => domeniu);
    writeFileSync(cale, text);
  }

  const git = (...args) => execFileSync("git", ["-C", dest, ...args], { stdio: "pipe" });
  git("init", "-b", "main");
  // pe laptop, numele și e-mailul pentru commit-uri sunt puse doar în depozitul buildwithac: le iau de acolo
  for (const cheie of ["user.name", "user.email"]) {
    const valoare = configGit(radacina, cheie);
    if (valoare) git("config", cheie, valoare);
  }
  git("add", "-A");
  git("commit", "-m", "Pornit din șablonul buildwithac");
  return dest;
}

// rulat direct, nu importat de teste
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [slug, nume, domeniu] = process.argv.slice(2);
  if (!slug || !nume) {
    console.error('Folosire: node servicii/site-uri/porneste.mjs <slug> "<Numele firmei>" [domeniu]');
    process.exit(1);
  }
  try {
    const radacina = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
    const dest = porneste({ radacina, slug, nume, domeniu });
    console.log(`Gata: ${dest}`);
    console.log("Pașii următori:");
    console.log(`  cd "${dest}"`);
    console.log("  npm install");
    console.log("  npm run dev   (http://localhost:3300)");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
