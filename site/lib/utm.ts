/** Parametrii din link care spun din ce reclamă sau postare a venit omul. */
export const CHEI_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export const CHEIE_STOCARE_UTM = "bwac_utm";

/** Din `?utm_source=…`: doar cheile cunoscute, nevide, tăiate la 200 de caractere. */
export function citesteUtm(search: string): Record<string, string> {
  const p = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const k of CHEI_UTM) {
    const v = p.get(k)?.trim();
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
