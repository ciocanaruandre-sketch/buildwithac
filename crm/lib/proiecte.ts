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

/** Din banii încasați efectiv, rotunjit la leu. null dacă procentul nu e stabilit. */
export function comision(incasatLei: number, procent: number | null): number | null {
  return procent === null ? null : Math.round((incasatLei * procent) / 100);
}

/** „2.400 lei”; „—” când suma lipsește. */
export function lei(n: number | null): string {
  if (n === null) return "—";
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} lei`;
}
