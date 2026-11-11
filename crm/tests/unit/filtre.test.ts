import { describe, expect, it } from "vitest";
import { cautare, cautareTelefon, dinParametri, filtruCautare, intervalPerioada, spreParametri, tiparCuvant } from "@/lib/filtre";

describe("dinParametri", () => {
  it("valorile necunoscute se ignoră; implicit „tot”, pagina 1", () => {
    expect(dinParametri({ stare: "xyz", pagina: "-3", perioada: "ieri2", sursa: "fax" })).toEqual({ perioada: "tot", pagina: 1 });
  });
  it("un „om” care nu e id sau „liber” se ignoră", () => {
    expect(dinParametri({ om: "abc" }).om).toBeUndefined();
    expect(dinParametri({ om: "liber" }).om).toBe("liber");
  });
  it("citește valorile bune", () => {
    expect(dinParametri({ q: " Elena ", stare: "callback", sursa: "reclama_meta", serviciu: "1la1", om: "4f1c2b9e-1111-4a5b-9c2d-000000000001", scurtatura: "ale_mele", perioada: "7zile", pagina: "2" })).toEqual({
      q: "Elena",
      stare: "callback",
      sursa: "reclama_meta",
      serviciu: "1la1",
      om: "4f1c2b9e-1111-4a5b-9c2d-000000000001",
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

describe("cautare", () => {
  it("împarte în cuvinte, fără semnele care strică filtrul", () => {
    expect(cautare("florarie iris").cuvinte).toEqual(["florarie", "iris"]);
    expect(cautare("  Elena · (Boabe), ").cuvinte).toEqual(["Elena", "Boabe"]);
  });
  it("cu cel puțin 3 cifre caută și după telefon, oricum ar fi scris", () => {
    expect(cautare("+40 722 000").telefon).toBe("40722000");
    expect(cautare("0722 000").telefon).toBe("40722000");
    expect(cautare("722000").telefon).toBe("722000");
  });
  it("prea puține cifre → fără telefon", () => {
    expect(cautare("ab").telefon).toBeNull();
  });
});

describe("tiparCuvant", () => {
  const gaseste = (cuvant: string, nume: string) => new RegExp(tiparCuvant(cuvant), "i").test(nume);
  it("nu ține cont de diacritice și de majuscule", () => {
    expect(gaseste("floraria", "Florăria Iris")).toBe(true);
    expect(gaseste("FLORĂRIA", "florăria iris")).toBe(true);
    expect(gaseste("stan", "Radu Ștan")).toBe(true);
    expect(gaseste("ceramica", "Atelier Ceramică")).toBe(true);
  });
  it("nu găsește ce nu e acolo", () => {
    expect(gaseste("stan", "Ioana Dumitru")).toBe(false);
  });
  it("semnele speciale se caută ca atare", () => {
    expect(gaseste("a.b", "axb")).toBe(false);
    expect(gaseste("a.b", "a.b")).toBe(true);
  });
});

describe("filtruCautare", () => {
  it("toate cuvintele în nume, sau e-mailul, sau telefonul", () => {
    expect(filtruCautare("ana ion")).toBe('and(nume.imatch."[aăâAĂÂ]n[aăâAĂÂ]",nume.imatch."[iîIÎ]on"),email_norm.ilike.%ana ion%');
    expect(filtruCautare("0722 000")).toBe('and(nume.imatch."0722",nume.imatch."000"),email_norm.ilike.%0722 000%,telefon_norm.like.%40722000%');
  });
  it("un singur cuvânt, fără telefon", () => {
    expect(filtruCautare("Elena")).toBe('nume.imatch."Elen[aăâAĂÂ]",email_norm.ilike.%elena%');
  });
});
