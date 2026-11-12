import { describe, expect, it } from "vitest";
import { adaugaLuni, coloaneIncasari, dePlatitOm, descrierePlan, incasatNet, LUNI, planDePlata, stareTransa, totaluriProiect, type Transa } from "@/lib/finante";

let n = 0;
const tr = (x: Partial<Transa>): Transa => ({
  id: `t${n++}`,
  proiect_id: "p",
  tip: "rata",
  eticheta: "Rata",
  suma_lei: 1000,
  scadenta: "2026-11-13",
  incasata_la: null,
  incasat_lei: null,
  returnat_lei: 0,
  abonament_id: null,
  ...x,
});

describe("adaugaLuni", () => {
  it("păstrează ziua; în lunile scurte trece pe ultima zi", () => {
    expect(adaugaLuni("2027-01-31", 1)).toBe("2027-02-28");
    expect(adaugaLuni("2028-01-31", 1)).toBe("2028-02-29");
    expect(adaugaLuni("2026-11-13", 3)).toBe("2027-02-13");
    expect(adaugaLuni("2026-12-30", 2)).toBe("2027-02-28");
  });
});

describe("planDePlata", () => {
  it("rate: împarte egal, diferența pe ultima, scadențe lunare", () => {
    const p = planDePlata(6000, { fel: "rate", nr: 4, primaZi: "2026-11-30" });
    expect(p.map((x) => x.suma_lei)).toEqual([1500, 1500, 1500, 1500]);
    expect(p.map((x) => x.scadenta)).toEqual(["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]);
    expect(p.map((x) => x.eticheta)).toEqual(["Rata 1 din 4", "Rata 2 din 4", "Rata 3 din 4", "Rata 4 din 4"]);
    expect(p.every((x) => x.tip === "rata")).toBe(true);
    expect(planDePlata(1000, { fel: "rate", nr: 3, primaZi: "2026-11-13" }).map((x) => x.suma_lei)).toEqual([333, 333, 334]);
  });

  it("avans + rest, cu procent sau cu sumă", () => {
    const p = planDePlata(6000, { fel: "avans", avans: { procent: 30 }, ziAvans: "2026-11-13", ziRest: "2026-12-20" });
    expect(p).toEqual([
      { tip: "avans", eticheta: "Avans", suma_lei: 1800, scadenta: "2026-11-13" },
      { tip: "rest", eticheta: "Restul", suma_lei: 4200, scadenta: "2026-12-20" },
    ]);
    expect(planDePlata(6000, { fel: "avans", avans: { lei: 2000 }, ziAvans: "2026-11-13", ziRest: "2026-12-20" }).map((x) => x.suma_lei)).toEqual([2000, 4000]);
  });

  it("tot odată: o tranșă", () => {
    expect(planDePlata(2400, { fel: "odata", zi: "2026-11-20" })).toEqual([{ tip: "odata", eticheta: "Toată suma", suma_lei: 2400, scadenta: "2026-11-20" }]);
  });
});

describe("descrierePlan", () => {
  it("spune felul planului, fără mentenanță", () => {
    expect(descrierePlan([])).toBe("Fără plan");
    expect(descrierePlan([tr({ tip: "odata" })])).toBe("Tot odată");
    expect(descrierePlan([tr({ tip: "avans" }), tr({ tip: "rest" }), tr({ tip: "mentenanta", abonament_id: "a" })])).toBe("Avans + rest");
    expect(descrierePlan([tr({}), tr({}), tr({}), tr({})])).toBe("4 rate lunare");
    expect(descrierePlan([tr({ tip: "extra" }), tr({ tip: "inainte" })])).toBe("2 tranșe");
  });
});

describe("stareTransa", () => {
  it("azi = urmează, ieri = întârzie, încasată, returnată", () => {
    expect(stareTransa(tr({ scadenta: "2026-11-13" }), "2026-11-13")).toBe("urmeaza");
    expect(stareTransa(tr({ scadenta: "2026-11-12" }), "2026-11-13")).toBe("intarziata");
    expect(stareTransa(tr({ incasata_la: "2026-11-01", incasat_lei: 1000 }), "2026-11-13")).toBe("incasata");
    expect(stareTransa(tr({ incasata_la: "2026-11-01", incasat_lei: 1000, returnat_lei: 200 }), "2026-11-13")).toBe("returnata");
  });
});

describe("totaluriProiect", () => {
  it("fără mentenanță; returnarea scade din încasat", () => {
    const t = [
      tr({ suma_lei: 2000, incasata_la: "2026-11-01", incasat_lei: 2000, returnat_lei: 500 }),
      tr({ suma_lei: 3000 }),
      tr({ tip: "mentenanta", abonament_id: "a", suma_lei: 300, incasata_la: "2026-11-05", incasat_lei: 300 }),
    ];
    expect(incasatNet(t[0])).toBe(1500);
    expect(totaluriProiect(t)).toEqual({ incasat: 1500, deIncasat: 3000, sumaTranse: 4500 });
  });
});

describe("coloaneIncasari", () => {
  it("împarte tranșele pe coloane și face cifrele lunii", () => {
    const azi = "2026-11-13";
    const t = [
      tr({ id: "veche", scadenta: "2026-11-02", suma_lei: 1000 }),
      tr({ id: "foarteVeche", scadenta: "2026-10-01", suma_lei: 500 }),
      tr({ id: "azi", scadenta: "2026-11-13", suma_lei: 700 }),
      tr({ id: "decembrie", scadenta: "2026-12-10", suma_lei: 900 }),
      tr({ id: "departe", scadenta: "2026-12-14", suma_lei: 100 }),
      tr({ id: "incasataAzi", scadenta: "2026-11-05", incasata_la: "2026-11-12", incasat_lei: 2000, suma_lei: 2000 }),
      tr({ id: "incasataInainte", scadenta: "2026-11-01", incasata_la: "2026-11-03", incasat_lei: 400, suma_lei: 400 }),
      tr({ id: "lunaTrecuta", scadenta: "2026-10-20", incasata_la: "2026-10-25", incasat_lei: 600, suma_lei: 600 }),
    ];
    const c = coloaneIncasari(t, azi);
    expect(c.intarzie.map((x) => x.id)).toEqual(["foarteVeche", "veche"]);
    expect(c.urmeaza.map((x) => x.id)).toEqual(["azi", "decembrie"]);
    expect(c.incasate.map((x) => x.id)).toEqual(["incasataAzi", "incasataInainte"]);
    expect(c.cifre).toEqual({ incasatLuna: 2400, programatLuna: 1000 + 700 + 2000 + 400, urmeazaLuna: 700, intarziate: 1500 });
  });
});

describe("dePlatitOm", () => {
  it("minusurile scad din total; nestabilitele se numără separat", () => {
    expect(
      dePlatitOm([
        { tip: "comision", suma_lei: 900, platit_la: null },
        { tip: "minus", suma_lei: -600, platit_la: null },
        { tip: "comision", suma_lei: null, platit_la: null },
        { tip: "comision", suma_lei: 5000, platit_la: "2026-11-01" },
      ]),
    ).toEqual({ total: 300, poatePlati: true, nestabilite: 1 });
    expect(dePlatitOm([{ tip: "minus", suma_lei: -600, platit_la: null }])).toEqual({ total: -600, poatePlati: false, nestabilite: 0 });
  });
});

it("lunile sunt în română, cu literă mică", () => {
  expect(LUNI).toHaveLength(12);
  expect(LUNI[10]).toBe("noiembrie");
});
