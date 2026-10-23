import { describe, it, expect } from "vitest";
import { cauta, normalizeaza } from "@/lib/cautare";

const g = (titlu: string, cuvant: string, unelte: string[], descriere = "") => ({ titlu, cuvant, unelte, descriere, slug: cuvant.toLowerCase() });
const GHIDURI = [
  g("Site-uri care nu arată „făcute cu AI”", "SITE", ["Claude Code", "21st.dev"], "Design de site"),
  g("Animații video cu Claude", "ANIMATII", ["GSAP", "HyperFrames"], "Intro-uri pentru site-ul tău"),
  g("Claude conectat la TradingView", "TRADING", ["MCP"], "Grafice"),
];

describe("normalizeaza", () => {
  it("scoate diacriticele și majusculele", () => expect(normalizeaza("ANIMAȚII")).toBe("animatii"));
  it("tratează ț cu sedilă", () => expect(normalizeaza("animaţii")).toBe("animatii"));
  it("tratează ș cu sedilă", () => expect(normalizeaza("şi Ș")).toBe("si s"));
  it("strânge spațiile", () => expect(normalizeaza("  a   b ")).toBe("a b"));
});

describe("cauta", () => {
  it("cuvântul exact e primul, marcat exact", () => {
    const r = cauta(GHIDURI, "site");
    expect(r[0].ghid.cuvant).toBe("SITE");
    expect(r[0].exact).toBe(true);
    expect(r.slice(1).every((x) => !x.exact)).toBe(true);
  });
  it("titlul vine înaintea descrierii", () => {
    expect(cauta(GHIDURI, "site").map((x) => x.ghid.cuvant)).toEqual(["SITE", "ANIMATII"]);
  });
  it("găsește după unelte", () => expect(cauta(GHIDURI, "21st").map((x) => x.ghid.cuvant)).toEqual(["SITE"]));
  it("fără diacritice găsește titlul cu diacritice", () => expect(cauta(GHIDURI, "animatii")[0].ghid.cuvant).toBe("ANIMATII"));
  it("întrebare goală → toate, fără exact", () => {
    const r = cauta(GHIDURI, "  ");
    expect(r).toHaveLength(3);
    expect(r.some((x) => x.exact)).toBe(false);
  });
  it("fără rezultat → []", () => expect(cauta(GHIDURI, "xyzxyz")).toEqual([]));
});
