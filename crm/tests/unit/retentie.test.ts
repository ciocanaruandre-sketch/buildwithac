import { describe, expect, it } from "vitest";
import { construiesteCopia, dataLimita, eLuni, ZILE_PASTRARE } from "@/lib/retentie";

describe("retenția", () => {
  it("se păstrează 90 de zile", () => {
    expect(ZILE_PASTRARE).toBe(90);
  });

  it("dataLimita = acum − 90 de zile", () => {
    expect(dataLimita(new Date("2026-11-10T04:00:00Z")).toISOString()).toBe("2026-08-12T04:00:00.000Z");
  });

  it("eLuni se uită la ora României", () => {
    expect(eLuni(new Date("2026-11-09T22:30:00Z"))).toBe(false); // marți 00:30 în România
    expect(eLuni(new Date("2026-11-09T04:00:00Z"))).toBe(true); // luni 06:00
    expect(eLuni(new Date("2026-11-08T22:30:00Z"))).toBe(true); // luni 00:30 (duminică în UTC)
  });
});

describe("construiesteCopia", () => {
  const tabele = { lead_uri: [{ id: "a", nume: "Ion" }], cereri: [] };

  it("atașamentul crm-<data>.json, cu toate tabelele", () => {
    const e = construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 0);
    expect(e.subiect).toBe("Copia CRM-ului, 2026-11-09");
    expect(e.atasamente?.[0].nume).toBe("crm-2026-11-09.json");
    const json = JSON.parse(Buffer.from(e.atasamente![0].continut, "base64").toString("utf8"));
    expect(json.tabele).toEqual(tabele);
    expect(e.text).not.toContain("șters");
  });

  it("spune câte lead-uri a șters, dacă a șters", () => {
    expect(construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 1).text).toContain("Am șters 1 lead mai vechi de 90 de zile");
    expect(construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 3).text).toContain("Am șters 3 lead-uri mai vechi de 90 de zile");
  });

  it("fără ş/ţ cu sedilă", () => {
    const e = construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 2);
    expect(e.subiect + e.text).not.toMatch(/[şţŞŢ]/);
  });
});
