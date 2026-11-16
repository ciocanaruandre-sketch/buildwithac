/**
 * Pagina KPI, partea pură: perioadele, comparația cu perioada de dinainte, formatarea și ce vede fiecare rol.
 * Cifrele le numără baza (funcțiile `kpi_*`); aici doar se afișează.
 */
import { lei } from "@/lib/proiecte";
import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import type { Rol } from "@/lib/tipuri";

export { lei };

export type Perioada = "sapt" | "luna" | "3l";
export const PERIOADE: Perioada[] = ["sapt", "luna", "3l"];
export const PERIOADA_IMPLICITA: Perioada = "luna";
export const ETICHETA_PERIOADA: Record<Perioada, string> = { sapt: "Săptămâna asta", luna: "Luna asta", "3l": "Ultimele 3 luni" };
export const FATA_DE: Record<Perioada, string> = {
  sapt: "față de săptămâna trecută",
  luna: "față de luna trecută",
  "3l": "față de cele 3 luni dinainte",
};

export const parsezaPerioada = (x: string | undefined): Perioada => (PERIOADE as string[]).includes(x ?? "") ? (x as Perioada) : PERIOADA_IMPLICITA;

/** Prima zi a lunii de acum `inapoi` luni, ca „2026-09-01”. */
function ziuaLunii(acum: Date, inapoi: number): string {
  const [a, l] = ziuaRomaniei(acum).split("-").map(Number);
  return new Date(Date.UTC(a, l - 1 - inapoi, 1)).toISOString().slice(0, 10);
}

/** Perioada aleasă (până acum) și cea de dinainte, întreagă. Totul pe ora României. */
export function intervale(p: Perioada, acum: Date): { de: Date; pana: Date; deAnt: Date; panaAnt: Date } {
  const miezul = (zi: string) => laOraRomaniei(zi, "00:00");
  let de: Date;
  let deAnt: Date;
  if (p === "sapt") {
    const [a, l, z] = ziuaRomaniei(acum).split("-").map(Number);
    const dinLuni = (new Date(Date.UTC(a, l - 1, z)).getUTCDay() + 6) % 7;
    de = miezul(ziuaPeste(acum, -dinLuni));
    deAnt = miezul(ziuaPeste(acum, -dinLuni - 7));
  } else {
    const luni = p === "luna" ? 1 : 3;
    de = miezul(ziuaLunii(acum, luni - 1));
    deAnt = miezul(ziuaLunii(acum, 2 * luni - 1));
  }
  return { de, pana: acum, deAnt, panaAnt: de };
}

export type Sens = "sus" | "jos";

/**
 * Săgeata față de perioada de dinainte. `sens` = încotro e mai bine. „procent” = schimbarea relativă
 * (față de 0 arată diferența), „pp” = puncte procentuale, „valoare” = diferența, formatată cu `fmt`.
 */
export function comparatie(
  acum: number | null,
  ant: number | null,
  sens: Sens,
  tip: "procent" | "pp" | "valoare",
  fmt: (n: number) => string = (n) => String(Math.round(n)),
): { text: string; bine: boolean | null } | null {
  if (acum === null || ant === null) return null;
  const dif = acum - ant;
  let text: string;
  if (tip === "procent" && ant !== 0) {
    const pr = Math.round((Math.abs(dif) / Math.abs(ant)) * 100);
    if (pr === 0) return { text: "la fel", bine: null };
    text = `${pr}%`;
  } else if (tip === "pp") {
    const pp = Math.round(Math.abs(dif));
    if (pp === 0) return { text: "la fel", bine: null };
    text = `${pp} pp`;
  } else {
    if (dif === 0) return { text: "la fel", bine: null };
    text = fmt(Math.abs(dif));
  }
  return { text: `${dif > 0 ? "↑" : "↓"} ${text}`, bine: sens === "sus" ? dif > 0 : dif < 0 };
}

/** Procentul a / b, rotunjit; null când b e 0 (se afișează „—”). */
export const rata = (a: number, b: number): number | null => (b === 0 ? null : Math.round((a / b) * 100));

export const afiseaza = (n: number | null | undefined, fmt: (n: number) => string): string => (n === null || n === undefined ? "—" : fmt(n));

/** „40 min”, „1 h 39 min”, „2 h”. */
export function durata(minute: number): string {
  const m = Math.round(minute);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

/** „1 zi”, „9,5 zile”, „21 de zile”. */
export function zile(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (r === 1) return "1 zi";
  const text = String(r).replace(".", ",");
  const deZile = Number.isInteger(r) && (r % 100 === 0 || r % 100 >= 20);
  return `${text} ${deZile ? "de zile" : "zile"}`;
}

export const procent = (n: number) => `${n}%`;
export const numar = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

export type OmTabel = { id: string; nume: string; rol: Rol; activ: boolean };

/**
 * Oamenii din tabelele „Pe oameni”: cei care au un rând în cifre, activii întâi, apoi cei plecați (marcați),
 * fiecare grup după nume. Cei plecați intră în totaluri, deci apar și aici.
 */
export function peOameni(randuri: { om_id: string | null }[], oameni: OmTabel[]): (OmTabel & { plecat: boolean })[] {
  const dupaId = new Map(oameni.map((o) => [o.id, o]));
  return randuri
    .flatMap((r) => {
      const o = r.om_id ? dupaId.get(r.om_id) : undefined;
      return o ? [{ ...o, plecat: !o.activ }] : [];
    })
    .sort((a, b) => Number(a.plecat) - Number(b.plecat) || a.nume.localeCompare(b.nume, "ro"));
}

export type Sectiune = "palnie" | "apeluri" | "inchideri" | "pierderi" | "proiecte" | "bani";

const SECTIUNI: Record<Rol, Sectiune[]> = {
  admin: ["palnie", "apeluri", "inchideri", "pierderi", "proiecte", "bani"],
  caller: ["apeluri"],
  closer: ["inchideri", "pierderi"],
  constructor: ["proiecte"],
};
export const sectiuniPentru = (rol: Rol): Sectiune[] => SECTIUNI[rol];

export const TITLU_SECTIUNE: Record<Sectiune, { admin: string; eu: string }> = {
  palnie: { admin: "De la lead la client", eu: "" },
  apeluri: { admin: "Apeluri", eu: "Apelurile mele" },
  inchideri: { admin: "Închideri", eu: "Discuțiile mele" },
  pierderi: { admin: "Pierderi și surse", eu: "De ce pierd" },
  proiecte: { admin: "Proiecte", eu: "Proiectele mele" },
  bani: { admin: "Bani", eu: "" },
};
