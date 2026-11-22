#!/usr/bin/env node
// Face PDF-ul unui document al clientului, în aspectul ghidurilor buildwithac. Totul rămâne pe laptop.
//   node servicii/automatizari/pdf/tipareste.mjs <slug> <tip>      → clienti/<slug>/automatizari/pdf/<tip>.pdf
//   node servicii/automatizari/pdf/tipareste.mjs --exemplu <tip>   → servicii/automatizari/pdf/exemple/<tip>.pdf
// <tip> = propunere | pornire | folosire. PDF-urile nu ajung niciodată în site/ (nici pe buildwithac.ro).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { documentInHtml, TIPURI } from "./document.mjs";
import { valideazaSlug } from "../../site-uri/porneste.mjs";

const AICI = dirname(fileURLToPath(import.meta.url));
const RADACINA = resolve(AICI, "..", "..", "..");
const SITE = join(RADACINA, "site");

/** Sursa și destinația, după argumente. Aruncă dacă ceva nu e în regulă. */
export function cai(argumente, radacina = RADACINA) {
  const [a, b] = argumente;
  let sursa, destinatie, tip;
  if (a === "--exemplu") {
    tip = b;
    sursa = join(radacina, "servicii", "automatizari", "pdf", "exemple", `${tip}.md`);
    destinatie = join(radacina, "servicii", "automatizari", "pdf", "exemple", `${tip}.pdf`);
  } else {
    if (!a || !b) throw new Error("Folosire: node servicii/automatizari/pdf/tipareste.mjs <slug> <tip> | --exemplu <tip>");
    const greseala = valideazaSlug(a);
    if (greseala) throw new Error(greseala);
    tip = b;
    sursa = join(radacina, "clienti", a, "automatizari", `${tip}.md`);
    destinatie = join(radacina, "clienti", a, "automatizari", "pdf", `${tip}.pdf`);
  }
  if (!TIPURI.includes(tip)) throw new Error(`Tip necunoscut „${tip}”. Tipurile: ${TIPURI.join(", ")}.`);
  const fataDeSite = relative(join(radacina, "site"), destinatie);
  if (!fataDeSite.startsWith("..") && !isAbsolute(fataDeSite)) {
    throw new Error(`Refuz să scriu sub site/: PDF-urile clienților nu ajung pe buildwithac.ro (${destinatie}).`);
  }
  return { sursa, destinatie, tip };
}

/** Fonturile site-ului (app/fonturi.css), cu fișierele puse direct în pagină. */
function fonturi() {
  const css = readFileSync(join(SITE, "app", "fonturi.css"), "utf8");
  return css.replace(/url\(\/fonts\/([^)]+)\)/g, (_, fisier) => {
    const date = readFileSync(join(SITE, "public", "fonts", fisier)).toString("base64");
    return `url(data:font/woff2;base64,${date})`;
  });
}

/** Domeniul stă doar în site/lib/config.ts. */
function domeniu() {
  const m = readFileSync(join(SITE, "lib", "config.ts"), "utf8").match(/domeniu:\s*"([^"]+)"/);
  if (!m) throw new Error("Nu găsesc domeniul în site/lib/config.ts.");
  return m[1];
}

export async function tipareste(argumente) {
  const { sursa, destinatie, tip } = cai(argumente);
  if (!existsSync(sursa)) throw new Error(`Nu găsesc documentul: ${sursa}`);
  const corp = documentInHtml(readFileSync(sursa, "utf8"), tip);
  const pagina = `<!doctype html><html lang="ro"><head><meta charset="utf-8"><style>${fonturi()}\n${readFileSync(join(AICI, "stil.css"), "utf8")}</style></head><body>${corp}</body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.emulateMedia({ media: "print" });
    await page.setContent(pagina, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      // o foaie mai mică de o jumătate de pagină A4 (~140 mm) nu se rupe între pagini
      const mm = 96 / 25.4;
      for (const f of document.querySelectorAll(".foaie")) {
        if (f.getBoundingClientRect().height < 140 * mm) f.classList.add("mica");
      }
    });
    mkdirSync(dirname(destinatie), { recursive: true });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;padding:0 12mm;display:flex;justify-content:space-between;font:8px Arial,sans-serif;color:#6b5f55"><span>${domeniu()}</span><span>pagina <span class="pageNumber"></span> din <span class="totalPages"></span></span></div>`,
    });
    writeFileSync(destinatie, pdf);
  } finally {
    await browser.close();
  }
  return destinatie;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  tipareste(process.argv.slice(2))
    .then((cale) => console.log(`PDF gata: ${cale}`))
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
