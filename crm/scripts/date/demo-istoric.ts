// Istoricul firmei demo pentru pagina KPI: ~6 luni de lead-uri, cu apelurile, discuțiile și rezultatele lor.
// Pur și determinist (aceleași `acum` și opțiuni dau același istoric). Lead-urile sunt scrise fără nume
// (anonimizate), ca să intre în cifre fără să umple listele cu care se filmează (`/lead-uri`, „Azi”, „Clienți”).
import type { ContTest } from "../../lib/echipa-test";
import { MOTIVE, type MotivCategorie } from "../../lib/motive";
import { laOraRomaniei, ziuaPeste, ziuaRomaniei } from "../../lib/timp";
import type { Serviciu, Stare, Sursa } from "../../lib/tipuri";
import { discutiiDemo, discutiiTrecuteDemo, leaduriDemo, type Optiuni } from "./demo-date";

export type EvenimentIstoric = { tip: string; autor: ContTest | null; la: string; detalii: Record<string, unknown> };
export type DiscutieIstoric = { closer: ContTest; incepe: string; neprezentat: boolean };
export type LeadIstoric = {
  nr: number;
  serviciu: Serviciu;
  sursa: Sursa;
  stare: Stare;
  intrat: string;
  caller: ContTest | null;
  closer: ContTest | null;
  categorie: MotivCategorie | null;
  parcurs: EvenimentIstoric[];
  discutii: DiscutieIstoric[];
};
export type IstoricDemo = { leaduri: LeadIstoric[] };
export type Ocupata = { closer: ContTest; incepe: Date };

/** Discuțiile lead-urilor demo (ținute și viitoare): istoricul nu pune altele peste ele, la același closer. */
export function ocupateDemo(o: Optiuni): Ocupata[] {
  const L = leaduriDemo(o);
  return [
    ...discutiiTrecuteDemo(o, L).map((d) => ({ closer: d.closer, incepe: d.incepe })),
    ...discutiiDemo(o, L).map((d) => ({ closer: L.find((l) => l.nr === d.nr)?.closer ?? "closer", incepe: d.incepe })),
  ];
}

const MIN = 60_000;
const ORA = 60 * MIN;

/** Generatorul de numere „la întâmplare”, mereu același pentru aceeași sămânță (mulberry32). */
function aleator(samanta: number) {
  let a = samanta >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURSE: [Sursa, number][] = [
  ["reclama_meta", 0.42],
  ["reclama_tiktok", 0.18],
  ["formular_site", 0.16],
  ["cold_calling", 0.1],
  ["recomandare", 0.08],
  ["dm_instagram", 0.06],
];
const SERVICII: [Serviciu, number][] = [
  ["site", 0.55],
  ["automatizari", 0.3],
  ["1la1", 0.15],
];

/** Prima zi a lunii de acum `inapoi` luni, la București. */
function inceputLuna(acum: Date, inapoi: number): Date {
  const [a, l] = ziuaRomaniei(acum).split("-").map(Number);
  return laOraRomaniei(new Date(Date.UTC(a, l - 1 - inapoi, 1)).toISOString().slice(0, 10), "00:00");
}

/** Istoricul pe cele 6 luni întregi dinainte plus luna curentă, cam 1–3 lead-uri pe zi, toate în trecut. */
export function istoricKpiDemo(o: Optiuni, ocupate: Ocupata[] = []): IstoricDemo {
  const acum = o.acum;
  const r = aleator(Math.floor(inceputLuna(acum, 0).getTime() / ORA));
  const alege = <T,>(lista: [T, number][]): T => {
    let x = r();
    for (const [v, p] of lista) {
      if ((x -= p) <= 0) return v;
    }
    return lista[lista.length - 1][0];
  };
  const om = (c: ContTest): ContTest => (o.singur ? "admin" : c);
  const CALLERI: ContTest[] = ["caller", "caller2"];
  const ocupat = new Set<string>();
  const leaduri: LeadIstoric[] = [];

  /** Primul loc liber al closerului, într-o zi lucrătoare, 09:00–17:30 (fără 14:00), începând cu `dupa`. */
  const loc = (closer: ContTest, dupa: number): number => {
    for (let zi = 0; zi < 30; zi++) {
      const z = ziuaPeste(new Date(dupa), zi);
      const zs = new Date(`${z}T12:00:00Z`).getUTCDay();
      if (zs === 0 || zs === 6) continue;
      for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) {
        if (m === 14 * 60) continue;
        const t = laOraRomaniei(z, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`).getTime();
        const cheie = `${closer}|${t}`;
        if (t < dupa || ocupat.has(cheie) || ocupate.some((x) => x.closer === closer && Math.abs(x.incepe.getTime() - t) < 30 * MIN)) continue;
        ocupat.add(cheie);
        return t;
      }
    }
    return Number.POSITIVE_INFINITY;
  };

  const start = inceputLuna(acum, 6).getTime();
  // zilele, de la cea mai veche; ultimele 24 de ore rămân ale lead-urilor demo scrise de mână
  for (let zi = ziuaRomaniei(new Date(start)), nr = 1; ; zi = ziuaPeste(new Date(`${zi}T12:00:00Z`), 1)) {
    const ziStart = laOraRomaniei(zi, "00:00").getTime();
    if (ziStart > acum.getTime() - 36 * ORA) break;
    const cate = 1 + Math.floor(r() * 3);
    for (let k = 0; k < cate; k++, nr++) {
      const intrat = ziStart + (8 + r() * 14) * ORA;
      if (intrat > acum.getTime() - 24 * ORA) continue;
      const p: EvenimentIstoric[] = [];
      const discutii: DiscutieIstoric[] = [];
      const sursa = alege(SURSE);
      const caller = om(CALLERI[Math.floor(r() * 2)]);
      const closer = om(r() < 0.7 ? "closer" : "admin");
      const ev = (tip: string, autor: ContTest | null, t: number, detalii: Record<string, unknown> = {}) => p.push({ tip, autor, la: new Date(t).toISOString(), detalii });
      const inTrecut = (t: number) => t < acum.getTime() - 30 * MIN;
      let stare = "nou" as Stare; // „as”: `muta` o schimbă din funcție, TypeScript n-ar vedea
      let areCloser = false;
      let categorie: MotivCategorie | null = null;
      const muta = (inn: Stare, autor: ContTest, t: number, extra: Record<string, unknown> = {}) => {
        ev("stare", autor, t, { de: stare, in: inn, ...extra });
        stare = inn;
      };
      const pierde = (lista: "pierdut" | "descalificat", autor: ContTest, t: number) => {
        const m = MOTIVE[lista];
        categorie = m[Math.floor(r() * (m.length - 0.4))] ?? "altceva";
        muta(lista, autor, t, { categorie });
      };

      ev("creat", null, intrat, { sursa });
      // primul apel: de obicei în câteva ore, uneori a doua zi
      let t = intrat + (r() < 0.75 ? 8 + r() * 180 : 14 + r() * 20 * 60) * MIN;
      if (r() < 0.05 || !inTrecut(t)) {
        leaduri.push({ nr, serviciu: alege(SERVICII), sursa, stare, intrat: new Date(intrat).toISOString(), caller: null, closer: null, categorie, parcurs: p, discutii });
        continue;
      }
      ev("caller", caller, t - 2 * MIN, { de: null, in: caller });
      // „Nu răspunde” de 0–3 ori, la câteva ore distanță; cine nu răspunde deloc are măcar o încercare
      const vaRaspunde = r() < 0.72;
      const nuRaspunde = Math.max(vaRaspunde ? 0 : 1, Math.floor(r() * r() * 4));
      for (let i = 1; i <= nuRaspunde && inTrecut(t); i++) {
        if (i === 1) muta("fara_raspuns", caller, t);
        ev("incercare", caller, t, { nr: i });
        t += (3 + r() * 20) * ORA;
      }
      if (!vaRaspunde || !inTrecut(t)) {
        leaduri.push({ nr, serviciu: alege(SERVICII), sursa, stare, intrat: new Date(intrat).toISOString(), caller, closer: null, categorie, parcurs: p, discutii });
        continue;
      }
      const dupaRaspuns = r();
      if (dupaRaspuns < 0.14) {
        pierde("descalificat", caller, t);
      } else {
        muta(dupaRaspuns < 0.4 ? "callback" : "a_raspuns", caller, t);
        if (stare === "callback") {
          t += (1 + r() * 3) * 24 * ORA;
          if (inTrecut(t) && r() < 0.55) muta("a_raspuns", caller, t);
        }
        // programarea, dacă a răspuns și discuția a trecut deja
        let incercari = 0;
        while (stare === "a_raspuns" || (stare === "callback" && incercari > 0)) {
          const d = loc(closer, t + (1 + r() * 4) * 24 * ORA);
          if (!inTrecut(d + 2 * ORA)) break;
          incercari++;
          ev("programat", caller, t + 3 * MIN, { closer, la: new Date(d).toISOString() });
          muta("programat", caller, t + 3 * MIN);
          if (!areCloser) ev("closer", caller, t + 3 * MIN, { de: null, in: closer });
          areCloser = true;
          const nuVine = r() < 0.17;
          discutii.push({ closer, incepe: new Date(d).toISOString(), neprezentat: nuVine });
          if (nuVine) {
            ev("neprezentat", closer, d + 40 * MIN, { la: new Date(d).toISOString() });
            muta("callback", closer, d + 40 * MIN);
            t = d + (1 + r() * 2) * 24 * ORA;
            // callerul îl sună din nou: o dată se mai programează; a doua oară, de obicei se pierde
            if (incercari >= 2 || r() < 0.45 || !inTrecut(t)) {
              if (inTrecut(t) && r() < 0.6) pierde("pierdut", caller, t);
              break;
            }
            continue;
          }
          // a venit: oferta sau pierdut pe loc
          t = d + 90 * MIN;
          if (r() < 0.22) {
            pierde("pierdut", closer, t);
            break;
          }
          muta("oferta_trimisa", closer, t);
          const rezultat = r();
          t += (2 + r() * 10) * 24 * ORA;
          if (!inTrecut(t)) break;
          if (rezultat < 0.3) muta("client", closer, t);
          else if (rezultat < 0.85) pierde("pierdut", closer, t);
          break;
        }
      }
      leaduri.push({ nr, serviciu: alege(SERVICII), sursa, stare, intrat: new Date(intrat).toISOString(), caller, closer: areCloser ? closer : null, categorie, parcurs: p, discutii });
    }
  }
  return { leaduri };
}
