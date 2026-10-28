import { describe, it, expect } from "vitest";
import { incarcaGhiduri } from "@/lib/ghiduri";

describe("conținutul din content/ghiduri", () => {
  it("se încarcă fără erori, iar ghidul vedetă e primul", () => {
    const g = incarcaGhiduri(undefined, { productie: false });
    expect(g.map((x) => x.cuvant)).toEqual(["SITE", "TEST", "ANIMATII", "TRADING"]);
    expect(g[0].pasi.length).toBeGreaterThanOrEqual(3);
  });

  it("în producție nu apare niciun ghid de exemplu", () => {
    expect(incarcaGhiduri(undefined, { productie: true }).map((x) => x.cuvant)).toEqual(["SITE"]);
  });
});
