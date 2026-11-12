/** Calculele fișei de client, fără bază de date. Zilele sunt „YYYY-MM-DD”, în ora României (ziuaRomaniei). */

export type TaskScurt = { id: string; titlu: string; om_id: string | null; termen: string | null; gata: boolean; gata_la: string | null; creat_la: string };

export function progres(t: { gata: boolean }[]): { gata: number; total: number; procent: number } {
  const gata = t.filter((x) => x.gata).length;
  return { gata, total: t.length, procent: t.length ? Math.round((gata / t.length) * 100) : 0 };
}

/** Ziua ca număr de zile, socotită în UTC: schimbarea orei nu mănâncă și nu adaugă o zi. */
const ziCaNumar = (zi: string): number => {
  const [a, l, z] = zi.split("-").map(Number);
  return Date.UTC(a, l - 1, z) / 86_400_000;
};

/** Câte zile a trecut termenul. 0 dacă n-are termen, e azi sau e în viitor. */
export function zileIntarziere(termen: string | null, azi: string): number {
  if (!termen) return 0;
  return Math.max(0, ziCaNumar(azi) - ziCaNumar(termen));
}

/** Negata întâi: termen crescător, cele fără termen la urmă, apoi după creare. Cele gata la sfârșit, recentele sus. */
export function ordoneazaTaskuri<T extends TaskScurt>(t: T[]): T[] {
  return [...t].sort((a, b) => {
    if (a.gata !== b.gata) return a.gata ? 1 : -1;
    if (a.gata) return (b.gata_la ?? "").localeCompare(a.gata_la ?? "");
    if (a.termen !== b.termen) {
      if (!a.termen) return 1;
      if (!b.termen) return -1;
      return a.termen.localeCompare(b.termen);
    }
    return a.creat_la.localeCompare(b.creat_la);
  });
}

export function urmatorulTask<T extends TaskScurt>(t: T[]): T | null {
  return ordoneazaTaskuri(t.filter((x) => !x.gata))[0] ?? null;
}

/** Task-urile negata, pe grupele din „Task-urile mele”. */
export function grupeazaTaskuri<T extends TaskScurt>(t: T[], azi: string): { intarziate: T[]; azi: T[]; urmeaza: T[]; faraTermen: T[] } {
  const g = { intarziate: [] as T[], azi: [] as T[], urmeaza: [] as T[], faraTermen: [] as T[] };
  for (const x of ordoneazaTaskuri(t.filter((y) => !y.gata))) {
    if (!x.termen) g.faraTermen.push(x);
    else if (x.termen < azi) g.intarziate.push(x);
    else if (x.termen === azi) g.azi.push(x);
    else g.urmeaza.push(x);
  }
  return g;
}

/** „2.400 lei”; „—” când suma lipsește. */
export function lei(n: number | null): string {
  if (n === null) return "—";
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} lei`;
}

/** „întârziat o zi”, „întârziat 3 zile”, „întârziat 20 de zile”; gol când nu e întârziat. */
export function textIntarziere(zile: number): string {
  if (zile <= 0) return "";
  if (zile === 1) return "întârziat o zi";
  const rest = zile % 100;
  return `întârziat ${zile}${rest === 0 || rest >= 20 ? " de" : ""} zile`;
}

/** O sumă scrisă de om, în lei întregi: „2.400” → 2400. Gol → null. Orice altceva → „gresit”. */
export function citesteLei(s: string): number | null | "gresit" {
  const curat = s.replace(/[\s.]/g, "");
  if (!curat) return null;
  if (!/^\d{1,8}$/.test(curat)) return "gresit";
  const n = Number(curat);
  return n <= 10_000_000 ? n : "gresit";
}

/** Un procent scris de om: „33,5” → 33.5. Gol → null (nestabilit). În afara 0–100 sau cu peste două zecimale → „gresit”. */
export function citesteProcent(s: string): number | null | "gresit" {
  const curat = s.replace(/[\s%]/g, "").replace(",", ".");
  if (!curat) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(curat)) return "gresit";
  const n = Number(curat);
  return n <= 100 ? n : "gresit";
}
