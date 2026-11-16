import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "@/lib/timp";

export type Interval = { de: Date; pana: Date };
export type ZiProgram = { zi: 1 | 2 | 3 | 4 | 5 | 6 | 7; de_la: string; pana_la: string };

/** Ziua săptămânii pentru „2026-11-09”: 1 = luni … 7 = duminică. */
const ziSaptamana = (zi: string) => {
  const [a, l, z] = zi.split("-").map(Number);
  return ((new Date(Date.UTC(a, l - 1, z)).getUTCDay() + 6) % 7) + 1;
};

const ORA_AVANS = 3_600_000;

export type Slot = { la: Date; ocupat: null | "discutie" | "google" };

const seSuprapune = (t: number, pas: number) => (o: Interval) => t < o.pana.getTime() && t + pas > o.de.getTime();

/**
 * Sloturile din următoarele `zile` zile (începând cu azi), în ora României: programul săptămânal tăiat în bucăți
 * de `durataMin`, fără cele care încep în mai puțin de o oră. Cele care se suprapun cu o discuție din CRM sau cu
 * ceva din Google Calendar rămân, marcate (discuția câștigă când sunt amândouă).
 */
export function sloturiCuOcupate(program: ZiProgram[], durataMin: number, discutii: Interval[], google: Interval[], acum: Date, zile: number): Slot[] {
  const pas = durataMin * 60_000;
  const devreme = acum.getTime() + ORA_AVANS;
  const rez: Slot[] = [];
  for (let d = 0; d < zile; d++) {
    const zi = d === 0 ? ziuaRomaniei(acum) : ziuaPeste(acum, d);
    for (const p of program.filter((x) => x.zi === ziSaptamana(zi))) {
      const inceput = laOraRomaniei(zi, p.de_la.slice(0, 5)).getTime();
      const sfarsit = laOraRomaniei(zi, p.pana_la.slice(0, 5)).getTime();
      for (let t = inceput; t + pas <= sfarsit; t += pas) {
        if (t < devreme) continue;
        const ocupat = discutii.some(seSuprapune(t, pas)) ? "discutie" : google.some(seSuprapune(t, pas)) ? "google" : null;
        rez.push({ la: new Date(t), ocupat });
      }
    }
  }
  return rez.sort((a, b) => a.la.getTime() - b.la.getTime());
}

/** Doar începuturile sloturilor libere (fără cele care se suprapun cu `ocupate`). */
export function sloturiLibere(program: ZiProgram[], durataMin: number, ocupate: Interval[], acum: Date, zile: number): Date[] {
  return sloturiCuOcupate(program, durataMin, ocupate, [], acum, zile)
    .filter((s) => !s.ocupat)
    .map((s) => s.la);
}
