import { describe, expect, it } from "vitest";
import { afiseaza, comparatie, durata, intervale, lei, parsezaPerioada, peOameni, rata, sectiuniPentru, TITLU_SECTIUNE, zile } from "@/lib/kpi";

const iso = (d: Date) => d.toISOString();

describe("intervale", () => {
  it("săptămâna începe luni 00:00 ora României, chiar dacă în UTC e încă duminică", () => {
    const i = intervale("sapt", new Date("2026-11-16T22:30:00Z")); // marți 17 nov., 00:30 ora României
    expect(iso(i.de)).toBe("2026-11-15T22:00:00.000Z");
    const luni = intervale("sapt", new Date("2026-11-15T22:30:00Z")); // luni 16 nov., 00:30 ora României
    expect(iso(luni.de)).toBe("2026-11-15T22:00:00.000Z");
    expect(iso(luni.deAnt)).toBe("2026-11-08T22:00:00.000Z");
    expect(iso(luni.panaAnt)).toBe(iso(luni.de));
    expect(iso(luni.pana)).toBe("2026-11-15T22:30:00.000Z");
  });

  it("luna, peste granița orei de vară", () => {
    const i = intervale("luna", new Date("2026-04-02T10:00:00Z"));
    expect(iso(i.de)).toBe("2026-03-31T21:00:00.000Z");
    expect(iso(i.deAnt)).toBe("2026-02-28T22:00:00.000Z");
    expect(iso(i.panaAnt)).toBe(iso(i.de));
  });

  it("ultimele 3 luni = luna curentă plus două; cele dinainte, întregi", () => {
    const i = intervale("3l", new Date("2026-11-15T10:00:00Z"));
    expect(iso(i.de)).toBe("2026-08-31T21:00:00.000Z");
    expect(iso(i.deAnt)).toBe("2026-05-31T21:00:00.000Z");
    expect(iso(i.panaAnt)).toBe(iso(i.de));
  });

  it("săptămâna peste ultima duminică din octombrie (ora de iarnă)", () => {
    const i = intervale("sapt", new Date("2026-10-28T10:00:00Z")); // miercuri
    expect(iso(i.de)).toBe("2026-10-25T22:00:00.000Z"); // luni 26 oct., 00:00 (+02)
    expect(iso(i.deAnt)).toBe("2026-10-18T21:00:00.000Z"); // luni 19 oct., 00:00 (+03)
  });

  it("săptămâna peste ultima duminică din martie (ora de vară)", () => {
    const i = intervale("sapt", new Date("2026-04-01T10:00:00Z")); // miercuri
    expect(iso(i.de)).toBe("2026-03-29T21:00:00.000Z"); // luni 30 mar., 00:00 (+03)
    expect(iso(i.deAnt)).toBe("2026-03-22T22:00:00.000Z"); // luni 23 mar., 00:00 (+02)
    // duminică 29 martie, după schimbarea orei: săptămâna a început luni, încă pe +02
    const dum = intervale("sapt", new Date("2026-03-29T12:00:00Z"));
    expect(iso(dum.de)).toBe("2026-03-22T22:00:00.000Z");
    expect(iso(dum.deAnt)).toBe("2026-03-15T22:00:00.000Z");
  });
});

describe("comparatie", () => {
  it("procent, puncte procentuale, valoare", () => {
    expect(comparatie(5, 3, "sus", "procent")).toEqual({ text: "↑ 67%", bine: true });
    expect(comparatie(3, 5, "sus", "procent")).toEqual({ text: "↓ 40%", bine: false });
    expect(comparatie(99, 190, "jos", "valoare", durata)).toEqual({ text: "↓ 1 h 31 min", bine: true });
    expect(comparatie(78, 77, "sus", "pp")).toEqual({ text: "↑ 1 pp", bine: true });
    expect(comparatie(4, 2, "jos", "valoare")).toEqual({ text: "↑ 2", bine: false });
  });
  it("față de 0, fără procent", () => {
    expect(comparatie(3, 0, "sus", "procent")).toEqual({ text: "↑ 3", bine: true });
  });
  it("la fel și fără date", () => {
    expect(comparatie(4, 4, "sus", "procent")).toEqual({ text: "la fel", bine: null });
    expect(comparatie(null, 4, "sus", "procent")).toBeNull();
    expect(comparatie(4, null, "sus", "procent")).toBeNull();
  });
});

describe("formatarea", () => {
  it("rata și „—”", () => {
    expect(rata(0, 0)).toBeNull();
    expect(rata(1, 3)).toBe(33);
    expect(afiseaza(null, lei)).toBe("—");
    expect(afiseaza(18600, lei)).toBe("18.600 lei");
  });
  it("durata și zilele", () => {
    expect(durata(40)).toBe("40 min");
    expect(durata(99)).toBe("1 h 39 min");
    expect(durata(120)).toBe("2 h");
    expect(zile(1)).toBe("1 zi");
    expect(zile(9.5)).toBe("9,5 zile");
    expect(zile(21)).toBe("21 de zile");
  });
});

describe("rolurile și link-ul", () => {
  it("secțiunile pe rol", () => {
    expect(sectiuniPentru("admin")).toEqual(["palnie", "apeluri", "inchideri", "pierderi", "proiecte", "bani"]);
    expect(sectiuniPentru("caller")).toEqual(["apeluri"]);
    expect(sectiuniPentru("closer")).toEqual(["inchideri", "pierderi"]);
    expect(sectiuniPentru("constructor")).toEqual(["proiecte"]);
    expect(TITLU_SECTIUNE.apeluri).toEqual({ admin: "Apeluri", eu: "Apelurile mele" });
    expect(TITLU_SECTIUNE.palnie.admin).toBe("De la lead la client");
  });
  it("perioada din link", () => {
    expect(parsezaPerioada("x")).toBe("luna");
    expect(parsezaPerioada(undefined)).toBe("luna");
    expect(parsezaPerioada("sapt")).toBe("sapt");
    expect(parsezaPerioada("3l")).toBe("3l");
  });
});

describe("peOameni", () => {
  const oameni = [
    { id: "b", nume: "Bogdan", rol: "caller" as const, activ: true },
    { id: "a", nume: "Ana", rol: "caller" as const, activ: true },
    { id: "z", nume: "Zoe", rol: "closer" as const, activ: false },
    { id: "c", nume: "Cristi", rol: "caller" as const, activ: false },
  ];
  it("arată și oamenii plecați cu activitate, marcați, după cei activi; totalul și necunoscuții nu", () => {
    const r = peOameni([{ om_id: null }, { om_id: "z" }, { om_id: "b" }, { om_id: "x" }, { om_id: "a" }, { om_id: "c" }], oameni);
    expect(r.map((o) => [o.nume, o.plecat])).toEqual([
      ["Ana", false],
      ["Bogdan", false],
      ["Cristi", true],
      ["Zoe", true],
    ]);
  });
});
