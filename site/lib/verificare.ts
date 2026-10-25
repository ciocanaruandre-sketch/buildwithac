import fs from "node:fs";
import path from "node:path";
import { ascundeCodul, pozitiiPasi, type Ghid } from "./ghiduri";

export type Problema = { nivel: "eroare" | "avertisment"; mesaj: string };

/** Singurele etichete din care se scrie un ghid. */
const COMPONENTE = ["Pas", "Prompt", "CeVezi", "DacaNuMerge", "GresealaMea", "Atentie", "DeCeAiNevoie"];
const SEDILA = /[şţŞŢ]/;
const UMPLUTURA = [/\b(TODO|TBD)\b/, /lorem ipsum/i, /\[(CAPTUR[AĂ]|LINK|PRE[TȚ])\]/i];
const PRET = /\d[\d.,]*\s*(\$|€|lei\b|ron\b|usd\b|eur\b)|[$€]\s*\d|gratuit/i;
const ZI = 86_400_000;

// data din frontmatter e la miezul nopții UTC; „azi” se ia după calendarul local (ora României)
const ziCalendar = (d: Date, utc: boolean) =>
  utc ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Tot ce se poate verifica automat dintr-un ghid (§12). Erorile blochează publicarea.
 * `ciorna`: înainte de previzualizare, capturile și coperta care lipsesc sunt doar avertismente.
 */
export function verificaGhid(g: Ghid, o: { dosarPublic: string; azi?: Date; ciorna?: boolean }): Problema[] {
  const azi = o.azi ?? new Date();
  const probleme: Problema[] = [];
  const eroare = (mesaj: string) => probleme.push({ nivel: "eroare", mesaj });
  const avertisment = (mesaj: string) => probleme.push({ nivel: "avertisment", mesaj });
  const lipsa = o.ciorna ? avertisment : eroare;

  const text = ascundeCodul(g.corp);
  const pasi = pozitiiPasi(g.corp);
  // numărul pasului în care se află o poziție din text (0 = înainte de primul pas)
  const pasLa = (i: number) => pasi.filter((p) => p.index <= i).length;
  const campuri = { titlu: g.titlu, descriere: g.descriere, ceGasesti: g.ceGasesti.join(" "), unelte: g.unelte.join(" ") };

  if (g.exemplu) eroare("e marcat exemplu: true; un ghid adevărat nu are câmpul (sau are exemplu: false)");
  if (!fs.existsSync(path.join(o.dosarPublic, "ghiduri", g.dosar, g.imagine)))
    lipsa(`imaginea de copertă lipsește: public/ghiduri/${g.dosar}/${g.imagine}`);

  for (const m of text.matchAll(/<CeVezi\b[^>]*?\bsrc="([^"]+)"/g)) {
    if (!fs.existsSync(path.join(o.dosarPublic, "ghiduri", g.dosar, m[1])))
      lipsa(`captură lipsă: ${m[1]}, pasul ${pasLa(m.index)} (pune fișierul în public/ghiduri/${g.dosar}/)`);
  }

  if (!/<DeCeAiNevoie\b/.test(text)) eroare("lipsește <DeCeAiNevoie> (conturi, abonamente cu preț, programe, timp)");
  if (!pasi.length) eroare("ghidul n-are niciun <Pas>");

  g.corp.split("\n").forEach((rand, i) => {
    if (SEDILA.test(rand)) eroare(`ş/ţ cu sedilă la rândul ${i + 1} al textului (după frontmatter); folosește ș/ț cu virgulă`);
  });
  for (const [camp, valoare] of Object.entries(campuri)) {
    if (SEDILA.test(valoare)) eroare(`ş/ţ cu sedilă în ${camp}; folosește ș/ț cu virgulă`);
  }

  for (const m of text.matchAll(/<([A-Za-z][\w.-]*)/g)) {
    if (!COMPONENTE.includes(m[1])) eroare(`etichetă nepermisă <${m[1]}> (pasul ${pasLa(m.index)}); ghidul se scrie doar din componente`);
  }

  const totText = [g.corp, ...Object.values(campuri)].join("\n");
  for (const r of UMPLUTURA) {
    const m = r.exec(totText);
    if (m) eroare(`text de umplutură rămas: „${m[0]}”`);
  }

  if (/<Prompt\b[^>]*>\s*<\/Prompt>|<Prompt\b[^>]*\/>/.test(g.corp)) eroare("un <Prompt> e gol");

  if (g.pdf) {
    const dosarPdf = path.join(o.dosarPublic, "pdf");
    const tipar = new RegExp(`^${g.slug}-[0-9a-f]{12}\\.pdf$`);
    const exista = fs.existsSync(dosarPdf) && fs.readdirSync(dosarPdf).some((f) => tipar.test(f));
    if (!exista) eroare(`pdf: true, dar nu există PDF-ul în public/pdf/ (rulează npm run pdf -- ${g.slug})`);
  }

  if (ziCalendar(g.actualizat, true) > ziCalendar(azi, false)) eroare("data actualizat e în viitor");
  if (g.publicat.getTime() > g.actualizat.getTime()) eroare("data publicat e după actualizat");

  const linii = (totText.match(/—/g) ?? []).length;
  if (linii) avertisment(`${linii} ${linii === 1 ? "linie lungă" : "linii lungi"} (—): semn de text făcut cu AI; reformulează cu virgulă, două puncte sau frază nouă`);

  const nevoie = /<DeCeAiNevoie\b[^>]*>([\s\S]*?)<\/DeCeAiNevoie>/.exec(g.corp);
  if (nevoie && !PRET.test(nevoie[1])) avertisment("<DeCeAiNevoie> n-are niciun preț (sau „gratuit”)");

  pasi.forEach((p, i) => {
    const sfarsit = pasi[i + 1]?.index ?? text.length;
    if (!text.slice(p.index, sfarsit).includes("<CeVezi"))
      avertisment(`pasul ${i + 1} „${p.titlu}” n-are captură; e ok doar dacă nu e un pas important`);
  });

  const greseli = (text.match(/<GresealaMea\b/g) ?? []).length;
  if (greseli) avertisment(`${greseli} ${greseli === 1 ? "notiță" : "notițe"} „greșeala mea”: confirmă că vin din clip sau de la Andrei, nu inventate`);

  if (g.descriere.length > 160) avertisment(`descrierea are ${g.descriere.length} caractere (peste 160, se taie în Google)`);
  if (azi.getTime() - g.actualizat.getTime() > 90 * ZI)
    avertisment("actualizat acum peste 90 de zile: verifică din nou prețurile, versiunile și pașii");

  return probleme;
}
