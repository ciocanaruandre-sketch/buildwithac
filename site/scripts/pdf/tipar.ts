import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { SITE } from "../../lib/config";

/** Numele PDF-ului: păstrează cheia unui PDF existent, ca link-ul trimis deja pe Instagram să meargă și după actualizare. */
export function numePdf(slug: string, existente: string[], cheieNoua = () => randomBytes(6).toString("hex")): string {
  const tipar = new RegExp(`^${slug}-[0-9a-f]{12}\\.pdf$`);
  return existente.find((f) => tipar.test(f)) ?? `${slug}-${cheieNoua()}.pdf`;
}

/** Pagina ghidului, tipărită în PDF cu stilul de tipar (components/ghid/tipar.css). */
export async function tiparesteGhid(page: Page, url: string): Promise<Buffer> {
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  // next/image încarcă leneș: fără asta, capturile de mai jos ar ieși cadre goale
  const lipsa = await page.evaluate(async () => {
    const imagini = [...document.images];
    imagini.forEach((i) => (i.loading = "eager"));
    // o imagine eșuată e deja „complete”, cu lățimea 0: nu mai trimite niciun eveniment, deci nu o așteptăm
    await Promise.all(imagini.map((i) => (i.complete ? null : new Promise((gata) => {
      i.addEventListener("load", gata, { once: true });
      i.addEventListener("error", gata, { once: true });
    }))));
    await document.fonts.ready;
    return imagini.filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src);
  });
  if (lipsa.length) throw new Error(`Imagini care nu s-au încărcat: ${lipsa.join(", ")}`);
  // indicatorul Next de pe serverul de dev (npm run pdf --url) nu intră în PDF
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const adresa = `${SITE.domeniu}${new URL(url).pathname}`;
  return page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;padding:0 12mm;display:flex;justify-content:space-between;font:8px Arial,sans-serif;color:#6b5f55"><span>${adresa}</span><span>pagina <span class="pageNumber"></span> din <span class="totalPages"></span></span></div>`,
  });
}
