export const SERVICII_CONTACT = [
  { cheie: "site", eticheta: "Site" },
  { cheie: "automatizari", eticheta: "Automatizări" },
  { cheie: "1la1", eticheta: "Sesiune 1 la 1 sau ghid personalizat" },
  { cheie: "altceva", eticheta: "Altceva" },
] as const;

export type CheieServiciu = (typeof SERVICII_CONTACT)[number]["cheie"];
export type CampContact = "nume" | "telefon" | "serviciu" | "descriere";
export type CerereContact = { nume: string; telefon: string; serviciu: CheieServiciu; descriere: string };

// cifre, „+” doar la început, spații, cratime, puncte, paranteze; orice țară
const TELEFON = /^\+?[\d\s\-.()]+$/;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : null);
const eticheta = (cheie: CheieServiciu) => SERVICII_CONTACT.find((s) => s.cheie === cheie)!.eticheta;

/** Aceeași verificare în browser și pe server. Nu aruncă niciodată excepții, orice ar primi. */
export function verificaCerere(date: unknown): { cerere: CerereContact } | { greseli: CampContact[] } {
  const d = (date && typeof date === "object" ? date : {}) as Record<string, unknown>;
  const nume = text(d.nume);
  const telefon = text(d.telefon);
  const serviciu = SERVICII_CONTACT.find((s) => s.cheie === d.serviciu)?.cheie;
  const descriere = d.descriere === undefined ? "" : text(d.descriere);

  const greseli: CampContact[] = [];
  if (nume === null || nume.length < 2 || nume.length > 80) greseli.push("nume");
  const cifre = telefon?.replace(/\D/g, "").length ?? 0;
  if (telefon === null || !TELEFON.test(telefon) || cifre < 7 || cifre > 15) greseli.push("telefon");
  if (!serviciu) greseli.push("serviciu");
  if (descriere === null || descriere.length > 1000) greseli.push("descriere");

  if (greseli.length) return { greseli };
  return { cerere: { nume: nume!, telefon: telefon!, serviciu: serviciu!, descriere: descriere! } };
}

const escapa = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const ORA = new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", dateStyle: "long", timeStyle: "short" });

/** E-mailul pe care îl primește Andrei: telefonul e link, ca să sune direct din e-mail. */
export function construiesteEmail(c: CerereContact, acum: Date): { subiect: string; text: string; html: string } {
  const serviciu = eticheta(c.serviciu);
  const descriere = c.descriere || "fără descriere";
  const trimisa = ORA.format(acum);
  const tel = c.telefon.replace(/[^\d+]/g, "");
  const subiect = `Cerere nouă: ${serviciu} · ${c.nume}`.replace(/\s*[\r\n]+\s*/g, " ");

  const text = [`Nume: ${c.nume}`, `Telefon: ${c.telefon}`, `Serviciu: ${serviciu}`, `Descriere: ${descriere}`, `Trimisă: ${trimisa}`].join("\n");
  const rand = (eticheta: string, valoare: string) => `<p><b>${eticheta}:</b> ${valoare}</p>`;
  const html = [
    rand("Nume", escapa(c.nume)),
    rand("Telefon", `<a href="tel:${tel}">${escapa(c.telefon)}</a>`),
    rand("Serviciu", escapa(serviciu)),
    rand("Descriere", escapa(descriere).replace(/\n/g, "<br>")),
    rand("Trimisă", escapa(trimisa)),
  ].join("\n");

  return { subiect, text, html };
}
