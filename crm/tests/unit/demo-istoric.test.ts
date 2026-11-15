import { describe, expect, it } from "vitest";
import { MOTIVE } from "../../lib/motive";
import { ziuaRomaniei } from "../../lib/timp";
import { istoricKpiDemo } from "../../scripts/date/demo-istoric";

const ACUMURI = [new Date("2026-11-12T09:00:00Z"), new Date("2026-11-15T18:00:00Z"), new Date("2027-03-02T07:30:00Z"), new Date("2026-08-31T20:00:00Z")];
const luna = (iso: string) => ziuaRomaniei(new Date(iso)).slice(0, 7);
const luniInainte = (acum: Date, n: number) => {
  const [a, l] = ziuaRomaniei(acum).split("-").map(Number);
  return new Date(Date.UTC(a, l - 1 - n, 1)).toISOString().slice(0, 7);
};

describe("firma demo: istoricul pentru KPI", () => {
  it("aceleași `acum` și opțiuni dau același istoric", () => {
    const o = { acum: ACUMURI[0], singur: false };
    expect(istoricKpiDemo(o)).toEqual(istoricKpiDemo({ ...o }));
  });

  for (const acum of ACUMURI) {
    const { leaduri } = istoricKpiDemo({ acum, singur: false });

    it(`${acum.toISOString()}: cele 6 luni dinainte au fiecare 30–80 de intrări și măcar un client; luna asta are intrări`, () => {
      for (let n = 1; n <= 6; n++) {
        const din = leaduri.filter((l) => luna(l.intrat) === luniInainte(acum, n));
        expect(din.length, luniInainte(acum, n)).toBeGreaterThanOrEqual(30);
        expect(din.length, luniInainte(acum, n)).toBeLessThanOrEqual(80);
        const clienti = leaduri.filter((l) => l.parcurs.some((e) => e.tip === "stare" && e.detalii.in === "client" && luna(e.la) === luniInainte(acum, n)));
        expect(clienti.length, luniInainte(acum, n)).toBeGreaterThanOrEqual(1);
      }
      if (ziuaRomaniei(acum).slice(8) >= "03") expect(leaduri.some((l) => luna(l.intrat) === luniInainte(acum, 0))).toBe(true);
    });

    it(`${acum.toISOString()}: nimic în viitor, parcursul în ordine, starea finală = ultima mutare`, () => {
      for (const l of leaduri) {
        const t = [l.intrat, ...l.parcurs.map((e) => e.la), ...l.discutii.map((d) => d.incepe)].map((x) => new Date(x).getTime());
        expect(Math.max(...t)).toBeLessThan(acum.getTime());
        const la = l.parcurs.map((e) => e.la);
        expect([...la].sort()).toEqual(la);
        expect(l.parcurs[0]).toMatchObject({ tip: "creat", la: l.intrat });
        const stari = l.parcurs.filter((e) => e.tip === "stare");
        expect(stari.at(-1)?.detalii.in ?? "nou").toBe(l.stare);
      }
    });

    it(`${acum.toISOString()}: pierdut și descalificat au mereu un motiv din listă`, () => {
      for (const l of leaduri) {
        for (const e of l.parcurs.filter((x) => x.tip === "stare" && (x.detalii.in === "pierdut" || x.detalii.in === "descalificat"))) {
          const lista = MOTIVE[e.detalii.in as "pierdut" | "descalificat"] as readonly string[];
          expect(lista).toContain(e.detalii.categorie);
        }
        if (l.stare === "pierdut" || l.stare === "descalificat") expect(l.categorie).toBe(l.parcurs.filter((e) => e.tip === "stare").at(-1)?.detalii.categorie);
      }
      expect(leaduri.some((l) => l.stare === "pierdut")).toBe(true);
      expect(leaduri.some((l) => l.stare === "descalificat")).toBe(true);
    });

    it(`${acum.toISOString()}: discuțiile nu se suprapun la același closer, nu sunt la 14:00, unele n-au venit`, () => {
      const d = leaduri.flatMap((l) => l.discutii);
      const chei = d.map((x) => `${x.closer}|${x.incepe}`);
      expect(new Set(chei).size).toBe(chei.length);
      const ora = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
      expect(d.filter((x) => ora(x.incepe) === "14:00")).toEqual([]);
      expect(d.some((x) => x.neprezentat)).toBe(true);
      expect(d.some((x) => !x.neprezentat)).toBe(true);
    });
  }

  it("singur: totul e al adminului", () => {
    const { leaduri } = istoricKpiDemo({ acum: ACUMURI[0], singur: true });
    expect(leaduri.every((l) => (l.caller ?? "admin") === "admin" && (l.closer ?? "admin") === "admin")).toBe(true);
    expect(leaduri.every((l) => l.parcurs.every((e) => (e.autor ?? "admin") === "admin") && l.discutii.every((x) => x.closer === "admin"))).toBe(true);
  });
});
