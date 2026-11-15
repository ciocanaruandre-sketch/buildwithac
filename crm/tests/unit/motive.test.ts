import { describe, expect, it } from "vitest";
import { ETICHETA_MOTIV, MOTIVE, motivValid, textMotiv } from "@/lib/motive";
import { descrieEveniment } from "@/lib/parcurs";

describe("motivele fixe", () => {
  it("listele, în ordinea din fișă", () => {
    expect(MOTIVE.pierdut.map((m) => ETICHETA_MOTIV[m])).toEqual(["Prea scump", "A ales pe altcineva", "Nu mai are nevoie", "Nu mai răspunde", "Altceva"]);
    expect(MOTIVE.descalificat.map((m) => ETICHETA_MOTIV[m])).toEqual(["Nu are firmă", "Număr greșit", "Nu e interesat", "Caută altceva", "Altceva"]);
  });

  it("motivValid", () => {
    expect(motivValid("pierdut", undefined, "")).toBe("Alege motivul.");
    expect(motivValid("pierdut", "numar_gresit", "")).toBe("Alege motivul.");
    expect(motivValid("pierdut", "altceva", "ab")).toBe("Scrie motivul.");
    expect(motivValid("pierdut", "altceva", "Se mută din oraș")).toBeNull();
    expect(motivValid("descalificat", "numar_gresit", "")).toBeNull();
  });

  it("textMotiv: eticheta, „Altceva: …”, sau textul vechi", () => {
    expect(textMotiv("prea_scump", null)).toBe("Prea scump");
    expect(textMotiv("altceva", "Se mută din oraș")).toBe("Altceva: Se mută din oraș");
    expect(textMotiv(null, "A ales un nepot")).toBe("A ales un nepot");
    expect(textMotiv(null, null)).toBeNull();
  });

  it("Parcursul arată categoria; evenimentele vechi, textul", () => {
    const nume = () => "";
    const e = (detalii: Record<string, unknown>) => ({ tip: "stare", detalii, la: "2026-11-15T10:00:00Z", autor_id: null });
    expect(descrieEveniment(e({ de: "programat", in: "pierdut", categorie: "prea_scump" }), nume)).toBe("Stare: Programat → Pierdut · Prea scump");
    expect(descrieEveniment(e({ de: "programat", in: "pierdut", categorie: "altceva", motiv: "Se mută" }), nume)).toBe("Stare: Programat → Pierdut · Altceva: Se mută");
    expect(descrieEveniment(e({ de: "programat", in: "pierdut", motiv: "Vechi" }), nume)).toBe("Stare: Programat → Pierdut · Vechi");
  });
});
