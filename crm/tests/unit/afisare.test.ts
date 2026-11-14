import { describe, expect, it } from "vitest";
import { initiale, leadUri, termenLung, ziScurta } from "@/lib/afisare";

describe("zilele din fișa clientului", () => {
  it("ziScurta: ziua din România a unui moment", () => {
    expect(ziScurta("2026-10-28T15:40:00Z")).toBe("28 oct.");
    // 23:30 UTC e deja a doua zi în România
    expect(ziScurta("2026-10-28T23:30:00Z")).toBe("29 oct.");
  });
  it("termenLung: un termen (YYYY-MM-DD) rămâne în ziua lui", () => {
    expect(termenLung("2026-11-13")).toBe("vineri, 13 nov.");
    expect(termenLung("2026-10-25")).toBe("duminică, 25 oct.");
  });
});

describe("initiale", () => {
  it("omul: primele litere din nume; clientul: din firmă", () => {
    expect(initiale("Radu Stan")).toBe("RS");
    expect(initiale("Laura Ene · Atelier Ceramică")).toBe("AC");
    expect(initiale("ana")).toBe("A");
  });
});

describe("leadUri", () => {
  it("1 lead, 3 lead-uri, 20 de lead-uri", () => {
    expect(leadUri(0)).toBe("0 lead-uri");
    expect(leadUri(1)).toBe("1 lead");
    expect(leadUri(19)).toBe("19 lead-uri");
    expect(leadUri(20)).toBe("20 de lead-uri");
    expect(leadUri(101)).toBe("101 lead-uri");
    expect(leadUri(120)).toBe("120 de lead-uri");
    expect(leadUri(200)).toBe("200 de lead-uri");
  });
});
