/** Fișierele de la „Materiale”: stau în bucketul privat „materiale”, pe calea <proiect>/<uuid>/<nume curat>. */

/** Cât primește bucketul (și cât spune migrația): 25 MB. Ce e mai mare se pune pe Drive, ca link. */
export const MARIME_MAXIMA = 25 * 1024 * 1024;
export const BUCKET = "materiale";

const LUNGIME_NUME = 80;

/** Numele sub care se ține fișierul: fără drumuri, fără diacritice, doar litere, cifre, „-”, „_” și extensia. */
export function numeCurat(nume: string): string {
  const simplu = nume.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const punct = simplu.lastIndexOf(".");
  const candidat = punct >= 0 ? simplu.slice(punct + 1) : "";
  const areExtensie = /^[a-zA-Z0-9]{1,8}$/.test(candidat);
  const extensie = areExtensie ? `.${candidat.toLowerCase()}` : "";
  const baza = (areExtensie ? simplu.slice(0, punct) : simplu).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${(baza || "fisier").slice(0, LUNGIME_NUME - extensie.length)}${extensie}`;
}

/** „900 B”, „2 KB”, „1,2 MB”. */
export function marimeCitibila(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = Math.round((n / (1024 * 1024)) * 10) / 10;
  return `${String(mb).replace(".", ",")} MB`;
}

const IMAGINI = ["jpg", "jpeg", "png", "webp", "gif", "heic"];

/** Eticheta mică din stânga rândului: PDF, ZIP, IMG sau FIȘ. */
export function etichetaFisier(nume: string): string {
  const extensie = nume.includes(".") ? nume.slice(nume.lastIndexOf(".") + 1).toLowerCase() : "";
  if (extensie === "pdf") return "PDF";
  if (extensie === "zip") return "ZIP";
  if (IMAGINI.includes(extensie)) return "IMG";
  return "FIȘ";
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CALE = new RegExp(`^(${UUID})/(${UUID})/([A-Za-z0-9._-]{1,${LUNGIME_NUME}})$`);

/** Desface o cale din bucket; null dacă nu arată ca una făcută de noi. */
export function desfaCalea(cale: string): { proiectId: string; dosar: string; nume: string } | null {
  const m = CALE.exec(cale);
  return m ? { proiectId: m[1], dosar: `${m[1]}/${m[2]}`, nume: m[3] } : null;
}
