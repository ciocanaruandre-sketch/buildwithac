import { describe, expect, it } from "vitest";
import { cautareTelefon, dinParametri, intervalPerioada, spreParametri } from "@/lib/filtre";

describe("dinParametri", () => {
  it("valorile necunoscute se ignoră; implicit „tot”, pagina 1", () => {
    expect(dinParametri({ stare: "xyz", pagina: "-3", perioada: "ieri2", sursa: "fax" })).toEqual({ perioada: "tot", pagina: 1 });
  });
  it("citește valorile bune", () => {
    expect(dinParametri({ q: " Elena ", stare: "callback", sursa: "tally_site", serviciu: "1la1", om: "abc", scurtatura: "ale_mele", perioada: "7zile", pagina: "2" })).toEqual({
      q: "Elena",
      stare: "callback",
      sursa: "tally_site",
      serviciu: "1la1",
      om: "abc",
      scurtatura: "ale_mele",
      perioada: "7zile",
      pagina: 2,
    });
  });
  it("o listă de valori ia prima valoare", () => {
    expect(dinParametri({ stare: ["nou", "client"] }).stare).toBe("nou");
  });
});

describe("spreParametri", () => {
  it("scrie înapoi doar ce nu e implicit, ca URL-ul să rămână scurt", () => {
    expect(spreParametri({ perioada: "tot", pagina: 1, stare: "nou" })).toBe("?stare=nou");
    expect(spreParametri({ perioada: "tot", pagina: 1 })).toBe("");
  });
});

describe("intervalPerioada", () => {
  const acum = new Date("2026-10-24T22:30:00Z"); // 25 oct., 01:30 în România (ora de vară)
  it("„azi” începe la miezul nopții în România", () => {
    expect(intervalPerioada("azi", acum).de?.toISOString()).toBe("2026-10-24T21:00:00.000Z");
  });
  it("„ieri” e ziua întreagă de dinainte", () => {
    const { de, pana } = intervalPerioada("ieri", acum);
    expect(de?.toISOString()).toBe("2026-10-23T21:00:00.000Z");
    expect(pana?.toISOString()).toBe("2026-10-24T21:00:00.000Z");
  });
  it("„luna” începe pe 1, la ora României", () => {
    expect(intervalPerioada("luna", acum).de?.toISOString()).toBe("2026-09-30T21:00:00.000Z");
  });
  it("„tot” n-are margini", () => {
    expect(intervalPerioada("tot", acum)).toEqual({});
  });
});

describe("cautareTelefon", () => {
  it("transformă un număr scris pe jumătate în forma din bază", () => {
    expect(cautareTelefon("0700 000 0")).toBe("407000000");
    expect(cautareTelefon("+40 721")).toBe("40721");
    expect(cautareTelefon("721 123")).toBe("721123");
  });
  it("prea puține cifre sau text → null", () => {
    expect(cautareTelefon("07")).toBeNull();
    expect(cautareTelefon("Elena")).toBeNull();
  });
});
