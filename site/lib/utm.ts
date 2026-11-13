/** Parametrii din link care spun din ce reclamă sau postare a venit omul. */
export const CHEI_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export const CHEIE_STOCARE_UTM = "bwac_utm";

/** Separatorul dintre ancoră și parametrii pe care unele platforme îi lipesc după ea (`#formular&utm_source=…`). */
const DUPA_ANCORA = /[&?]/;

/** Numele ancorei din `location.hash`, fără parametrii lipiți după ea. */
export function ancoraDinHash(hash: string): string {
  return hash.replace(/^#/, "").split(DUPA_ANCORA)[0];
}

/**
 * Din `?utm_source=…`: doar cheile cunoscute, nevide, tăiate la 200 de caractere.
 * Dacă reclama a lipit parametrii după ancoră (`#formular&utm_source=…`), se citesc și de acolo; cei dinainte de `#` câștigă.
 */
export function citesteUtm(search: string, hash = ""): Record<string, string> {
  const surse = [new URLSearchParams(search)];
  const i = hash.search(DUPA_ANCORA);
  if (i >= 0) surse.push(new URLSearchParams(hash.slice(i + 1)));
  const utm: Record<string, string> = {};
  for (const k of CHEI_UTM) {
    const v = surse.map((p) => p.get(k)?.trim()).find(Boolean);
    if (v) utm[k] = v.slice(0, 200);
  }
  return utm;
}

/** Ce vine de la browser: păstrăm doar cheile cunoscute cu valori text. Orice altceva → {}. */
export function curataUtm(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const utm: Record<string, string> = {};
  for (const k of CHEI_UTM) {
    const x = (v as Record<string, unknown>)[k];
    if (typeof x === "string" && x.trim()) utm[k] = x.trim().slice(0, 200);
  }
  return utm;
}
