/**
 * Datele firmei: singurul loc cu numele, domeniul, telefonul, adresa și rețelele.
 * Textele, prețurile, programul și pozele stau în lib/continut.ts, nu aici.
 * Telefoanele se scriu oricum („0722 123 456”); testele verifică să fie valide.
 */
export type Firma = {
  nume: string;
  slug: string;
  domeniu: string;
  url: string;
  telefon: string;
  whatsapp: string | null;
  adresa: string;
  /** link Google Maps */
  harta: string;
  retele: { instagram?: string; facebook?: string; tiktok?: string };
  /** Vercel Web Analytics, fără cookie-uri; doar la varianta cu mentenanță */
  analytics: boolean;
  /** „Site făcut de buildwithac” în subsol; se scoate dacă cere clientul */
  creditBuildwithac: boolean;
};

const domeniu = "__DOMENIU__";

export const FIRMA: Firma = {
  nume: "__NUME_FIRMA__",
  slug: "__SLUG__",
  domeniu,
  url: `https://${domeniu}`,
  telefon: "0700 000 000",
  whatsapp: "0700 000 000",
  adresa: "Strada Exemplu 1, București",
  harta: "https://maps.google.com/?q=Bucure%C8%99ti",
  retele: {},
  analytics: true,
  creditBuildwithac: true,
};
