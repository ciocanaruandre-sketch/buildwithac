/** Calculele finanțelor, fără bază de date. Zilele sunt „YYYY-MM-DD”, în ora României (ziuaRomaniei). */
import type { TipTransa } from "@/lib/tipuri";

export type Transa = {
  id: string;
  proiect_id: string;
  tip: TipTransa;
  eticheta: string;
  suma_lei: number;
  scadenta: string;
  incasata_la: string | null;
  incasat_lei: number | null;
  returnat_lei: number;
  abonament_id: string | null;
};

export type StareTransa = "incasata" | "returnata" | "intarziata" | "urmeaza";

export type AlegerePlan =
  | { fel: "odata"; zi: string }
  | { fel: "avans"; avans: { lei: number } | { procent: number }; ziAvans: string; ziRest: string }
  | { fel: "rate"; nr: number; primaZi: string };

export type TransaNoua = { tip: TipTransa; eticheta: string; suma_lei: number; scadenta: string };

export type ComisionOm = { tip: "comision" | "minus" | string; suma_lei: number | null; platit_la: string | null };

export const LUNI = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"] as const;

const parti = (zi: string) => zi.split("-").map(Number) as [number, number, number];
const scrie = (a: number, l: number, z: number) => `${a}-${String(l).padStart(2, "0")}-${String(z).padStart(2, "0")}`;
const luna = (zi: string) => zi.slice(0, 7);

/** Aceeași zi a lunii, peste `n` luni; în lunile mai scurte, ultima zi a lunii. */
export function adaugaLuni(zi: string, n: number): string {
  const [a, l, z] = parti(zi);
  const tinta = new Date(Date.UTC(a, l - 1 + n, 1));
  const ultima = new Date(Date.UTC(tinta.getUTCFullYear(), tinta.getUTCMonth() + 1, 0)).getUTCDate();
  return scrie(tinta.getUTCFullYear(), tinta.getUTCMonth() + 1, Math.min(z, ultima));
}

/** Ziua din `zi` peste `n` zile. */
function ziDupa(zi: string, n: number): string {
  const [a, l, z] = parti(zi);
  return new Date(Date.UTC(a, l - 1, z + n)).toISOString().slice(0, 10);
}

/** Tranșele planului ales. La rate, fiecare are partea întreagă, iar diferența de rotunjire merge pe ultima. */
export function planDePlata(pret: number, a: AlegerePlan): TransaNoua[] {
  if (a.fel === "odata") return [{ tip: "odata", eticheta: "Toată suma", suma_lei: pret, scadenta: a.zi }];
  if (a.fel === "avans") {
    const avans = "lei" in a.avans ? a.avans.lei : Math.round((pret * a.avans.procent) / 100);
    return [
      { tip: "avans", eticheta: "Avans", suma_lei: avans, scadenta: a.ziAvans },
      { tip: "rest", eticheta: "Restul", suma_lei: pret - avans, scadenta: a.ziRest },
    ];
  }
  const parte = Math.floor(pret / a.nr);
  return Array.from({ length: a.nr }, (_, i) => ({
    tip: "rata" as const,
    eticheta: `Rata ${i + 1} din ${a.nr}`,
    suma_lei: i === a.nr - 1 ? pret - parte * (a.nr - 1) : parte,
    scadenta: adaugaLuni(a.primaZi, i),
  }));
}

/** „4 rate lunare”, „Avans + rest”, „Tot odată”; mentenanța nu intră. */
export function descrierePlan(t: Pick<Transa, "tip" | "abonament_id">[]): string {
  const plan = t.filter((x) => !x.abonament_id);
  if (!plan.length) return "Fără plan";
  const tipuri = new Set(plan.map((x) => x.tip));
  if (tipuri.size === 1 && tipuri.has("odata")) return "Tot odată";
  if ([...tipuri].every((x) => x === "avans" || x === "rest") && tipuri.has("avans")) return "Avans + rest";
  if (tipuri.size === 1 && tipuri.has("rata")) return `${plan.length} rate lunare`;
  return plan.length === 1 ? "O tranșă" : `${plan.length} tranșe`;
}

export function stareTransa(t: Transa, azi: string): StareTransa {
  if (t.incasata_la) return t.returnat_lei > 0 ? "returnata" : "incasata";
  return t.scadenta < azi ? "intarziata" : "urmeaza";
}

/** Cât a rămas din încasare după returnări. */
export function incasatNet(t: Pick<Transa, "incasat_lei" | "returnat_lei">): number {
  return (t.incasat_lei ?? 0) - t.returnat_lei;
}

/** Totalurile planului de plată (fără mentenanță). Prețul îl are pagina, din proiect. */
export function totaluriProiect(t: Transa[]): { incasat: number; deIncasat: number; sumaTranse: number } {
  const plan = t.filter((x) => !x.abonament_id);
  const incasat = plan.reduce((s, x) => s + (x.incasata_la ? incasatNet(x) : 0), 0);
  const deIncasat = plan.reduce((s, x) => s + (x.incasata_la ? 0 : x.suma_lei), 0);
  return { incasat, deIncasat, sumaTranse: incasat + deIncasat };
}

/** Coloanele paginii Finanțe (cu mentenanța) și cele trei cifre de sus. */
export function coloaneIncasari<T extends Transa>(t: T[], azi: string): { intarzie: T[]; urmeaza: T[]; incasate: T[]; cifre: { incasatLuna: number; programatLuna: number; urmeazaLuna: number; intarziate: number } } {
  const peste30 = ziDupa(azi, 30);
  const lunaAzi = luna(azi);
  const neincasate = t.filter((x) => !x.incasata_la).sort((a, b) => a.scadenta.localeCompare(b.scadenta));
  const intarzie = neincasate.filter((x) => x.scadenta < azi);
  const urmeaza = neincasate.filter((x) => x.scadenta >= azi && x.scadenta <= peste30);
  const incasate = t.filter((x) => x.incasata_la && luna(x.incasata_la) === lunaAzi).sort((a, b) => b.incasata_la!.localeCompare(a.incasata_la!));
  const suma = (l: T[], f: (x: T) => number) => l.reduce((s, x) => s + f(x), 0);
  return {
    intarzie,
    urmeaza,
    incasate,
    cifre: {
      incasatLuna: suma(incasate, incasatNet),
      programatLuna: suma(t.filter((x) => luna(x.scadenta) === lunaAzi), (x) => x.suma_lei),
      urmeazaLuna: suma(urmeaza.filter((x) => luna(x.scadenta) === lunaAzi), (x) => x.suma_lei),
      intarziate: suma(intarzie, (x) => x.suma_lei),
    },
  };
}

/** Cât are de primit omul: comisioanele neplătite minus minusurile nestinse. Cele cu procent nestabilit nu au sumă încă. */
export function dePlatitOm(c: ComisionOm[]): { total: number; poatePlati: boolean; nestabilite: number } {
  const neplatite = c.filter((x) => !x.platit_la);
  const total = neplatite.reduce((s, x) => s + (x.suma_lei ?? 0), 0);
  return { total, poatePlati: total > 0, nestabilite: neplatite.filter((x) => x.suma_lei === null).length };
}

/** „o zi”, „3 zile”, „20 de zile” (ca textIntarziere din lib/proiecte, fără „întârziat”). */
export function textZile(n: number): string {
  if (n === 1) return "o zi";
  const rest = n % 100;
  return `${n}${rest === 0 || rest >= 20 ? " de" : ""} zile`;
}
