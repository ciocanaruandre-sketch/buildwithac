export type GhidCautabil = { titlu: string; cuvant: string; unelte: string[]; descriere: string };
export type Rezultat<T extends GhidCautabil> = { ghid: T; exact: boolean };

export function normalizeaza(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// 0 = cuvântul exact, 1 = titlu, 2 = unelte sau cuvânt, 3 = descriere; -1 = nu se potrivește
function rang(g: GhidCautabil, q: string): number {
  if (normalizeaza(g.cuvant) === q) return 0;
  if (normalizeaza(g.titlu).includes(q)) return 1;
  if ([g.cuvant, ...g.unelte].some((u) => normalizeaza(u).includes(q))) return 2;
  if (normalizeaza(g.descriere).includes(q)) return 3;
  return -1;
}

export function cauta<T extends GhidCautabil>(ghiduri: T[], intrebare: string): Rezultat<T>[] {
  const q = normalizeaza(intrebare);
  if (!q) return ghiduri.map((ghid) => ({ ghid, exact: false }));
  const cuvinte = q.split(" ");
  return ghiduri
    .map((ghid) => {
      const ranguri = cuvinte.map((c) => rang(ghid, c));
      // fiecare cuvânt trebuie să se potrivească undeva; cel mai slab decide locul
      return { ghid, r: ranguri.includes(-1) ? -1 : Math.max(...ranguri), exact: normalizeaza(ghid.cuvant) === q };
    })
    .filter((x) => x.r >= 0)
    .sort((a, b) => (a.exact === b.exact ? a.r - b.r : a.exact ? -1 : 1))
    .map(({ ghid, exact }) => ({ ghid, exact }));
}
