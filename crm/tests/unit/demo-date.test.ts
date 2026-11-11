import { describe, expect, it } from "vitest";
import { discutiiDemo, leaduriDemo, telefonDemo, telefonNormDemo } from "../../scripts/date/demo-date";

const acum = new Date("2026-11-12T09:00:00Z"); // o miercuri
const L = leaduriDemo({ acum, singur: false });

describe("firma demo: lead-urile", () => {
  it("are 40–60 de lead-uri, din toate sursele cerute și în toate stările", () => {
    expect(L.length).toBeGreaterThanOrEqual(40);
    expect(L.length).toBeLessThanOrEqual(60);
    for (const s of ["formular_site", "reclama_meta", "reclama_tiktok", "recomandare", "cold_calling"]) expect(L.some((l) => l.sursa === s)).toBe(true);
    for (const s of ["nou", "fara_raspuns", "a_raspuns", "callback", "programat", "oferta_trimisa", "client", "pierdut", "descalificat"]) expect(L.some((l) => l.stare === s)).toBe(true);
    expect(L.filter((l) => l.stare === "programat")).toHaveLength(5);
  });

  it("nimic de test, nimic real, totul sub 90 de zile", () => {
    const text = JSON.stringify(L);
    expect(text).not.toMatch(/test|e2e|demo|lorem/i);
    expect(text).not.toMatch(/[şţŞŢ]/);
    expect(L.every((l) => l.acumZile >= 1 && l.acumZile <= 80)).toBe(true);
    expect(new Set(L.map((l) => l.nr)).size).toBe(L.length);
    expect(new Set(L.map((l) => l.nume)).size).toBe(L.length);
  });

  it("parcursul e în ordine și nu trece de ziua intrării", () => {
    for (const l of L) {
      const z = l.parcurs.map((p) => p.acumZile);
      expect(z.every((x) => x <= l.acumZile && x >= 1)).toBe(true);
      expect([...z].sort((a, b) => b - a)).toEqual(z);
    }
  });

  it("parcursul se potrivește cu starea", () => {
    for (const l of L) {
      expect(l.parcurs[0].tip).toBe("creat");
      const stari = l.parcurs.filter((p) => p.tip === "stare");
      if (l.stare === "nou") expect(stari).toHaveLength(0);
      else expect(stari.at(-1)?.detalii?.in).toBe(l.stare);
      if (l.stare === "programat") expect(l.parcurs.some((p) => p.tip === "programat")).toBe(true);
    }
  });

  it("singur: totul e al adminului", () => {
    const S = leaduriDemo({ acum, singur: true });
    expect(S.every((l) => (l.caller ?? "admin") === "admin" && (l.closer ?? "admin") === "admin")).toBe(true);
    expect(S.every((l) => l.notite.every((n) => n.autor === "admin") && l.parcurs.every((p) => (p.autor ?? "admin") === "admin"))).toBe(true);
  });

  it("telefoanele nu se ciocnesc cu seed-ul și cu e2e", () => {
    expect(telefonDemo(7)).toBe("0700 100 007");
    expect(telefonNormDemo(7)).toBe("40700100007");
    expect(L.every((l) => /^40700100\d{3}$/.test(telefonNormDemo(l.nr)))).toBe(true);
  });

  it("discuțiile cad în zile lucrătoare, 10–18 ora României, fără suprapuneri", () => {
    const D = discutiiDemo({ acum, singur: false }, L);
    expect(D.length).toBe(L.filter((l) => l.stare === "programat").length);
    for (const d of D) {
      const ora = Number(new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "numeric", hour12: false }).format(d.incepe));
      expect(ora).toBeGreaterThanOrEqual(10);
      expect(ora).toBeLessThan(18);
      const zi = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Bucharest", weekday: "short" }).format(d.incepe);
      expect(["Sat", "Sun"]).not.toContain(zi);
      expect(d.incepe.getTime()).toBeGreaterThan(acum.getTime());
    }
    const t = D.map((d) => d.incepe.getTime()).sort((a, b) => a - b);
    for (let i = 1; i < t.length; i++) expect(t[i] - t[i - 1]).toBeGreaterThanOrEqual(30 * 60_000);
  });
});
