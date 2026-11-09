import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";

export type Interval = { de: Date; pana: Date };
export type ZiProgram = { zi: 1 | 2 | 3 | 4 | 5 | 6 | 7; de_la: string; pana_la: string };

/** Ziua săptămânii pentru „2026-11-09”: 1 = luni … 7 = duminică. */
const ziSaptamana = (zi: string) => {
  const [a, l, z] = zi.split("-").map(Number);
  return ((new Date(Date.UTC(a, l - 1, z)).getUTCDay() + 6) % 7) + 1;
};

const ORA_AVANS = 3_600_000;

/**
 * Începuturile sloturilor libere din următoarele `zile` zile (începând cu azi), în ora României:
 * programul săptămânal tăiat în bucăți de `durataMin`, fără cele care se suprapun cu `ocupate`
 * și fără cele care încep în mai puțin de o oră.
 */
export function sloturiLibere(program: ZiProgram[], durataMin: number, ocupate: Interval[], acum: Date, zile: number): Date[] {
  const pas = durataMin * 60_000;
  const devreme = acum.getTime() + ORA_AVANS;
  const rez: Date[] = [];
  for (let d = 0; d < zile; d++) {
    const zi = d === 0 ? ziuaRomaniei(acum) : ziuaPeste(acum, d);
    for (const p of program.filter((x) => x.zi === ziSaptamana(zi))) {
      const inceput = laOraRomaniei(zi, p.de_la.slice(0, 5)).getTime();
      const sfarsit = laOraRomaniei(zi, p.pana_la.slice(0, 5)).getTime();
      for (let t = inceput; t + pas <= sfarsit; t += pas) {
        if (t < devreme) continue;
        if (ocupate.some((o) => t < o.pana.getTime() && t + pas > o.de.getTime())) continue;
        rez.push(new Date(t));
      }
    }
  }
  return rez.sort((a, b) => a.getTime() - b.getTime());
}
