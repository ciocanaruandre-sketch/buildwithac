import { describe, expect, it } from "vitest";
import { clientiDemo, discutiiDemo, laOra, leaduriDemo, telefonDemo, telefonNormDemo } from "../../scripts/date/demo-date";

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
      // o discuție care a avut deja loc își știe ziua (Parcursul o afișează)
      for (const p of l.parcurs.filter((e) => e.tip === "programat"))
        if (l.stare !== "programat") expect(p.detalii?.discutieAcumZile).toEqual(expect.any(Number));
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

describe("firma demo: clienții", () => {
  const C = clientiDemo({ acum, singur: false });

  it("clienții acoperă serviciile, stadiile și cazurile cerute", () => {
    expect(C.length).toBe(5);
    const P = C.flatMap((c) => c.proiecte);
    for (const s of ["discutie", "schita", "constructie", "revizii", "livrat", "mentenanta"]) expect(P.some((p) => p.stadiu === s)).toBe(true);
    for (const s of ["site", "automatizari", "1la1", "altceva"]) expect(P.some((p) => p.serviciu === s)).toBe(true);
    expect(C.some((c) => c.proiecte.length === 2)).toBe(true);
    expect(P.some((p) => p.inchisAcumZile !== undefined)).toBe(true);
    expect(P.some((p) => p.taskuri.some((t) => t.termenPesteZile < 0 && !t.gata))).toBe(true);
    expect(P.some((p) => p.taskuri.some((t) => t.termenPesteZile === 0))).toBe(true);
    for (const s of ["trimis", "aprobat", "de_refacut"]) expect(P.some((p) => p.livrari.some((l) => l.stare === s))).toBe(true);
    expect(P.every((p) => p.incasat <= p.pret)).toBe(true);
    expect(P.every((p) => p.taskuri.length >= 3 && p.taskuri.length <= 8)).toBe(true);
  });

  it("Radu e pe 3 proiecte: 30% la site-uri, 40% la automatizări; task-urile lui doar pe proiectele lui", () => {
    const P = C.flatMap((c) => c.proiecte);
    const ale = P.filter((p) => p.procentRadu !== undefined);
    expect(ale).toHaveLength(3);
    for (const p of ale) expect(p.procentRadu).toBe(p.serviciu === "site" ? 30 : 40);
    for (const p of P) if (p.procentRadu === undefined) expect(p.taskuri.every((t) => t.om === "admin")).toBe(true);
  });

  it("fiecare client vine dintr-un lead demo cu starea „client”, după ziua intrării", () => {
    const L = leaduriDemo({ acum, singur: false });
    for (const c of C) {
      const l = L.find((x) => x.nr === c.nrLead);
      expect(l?.stare).toBe("client");
      expect(c.clientDinAcumZile).toBeLessThan(l!.acumZile);
      for (const p of c.proiecte) if (p.inchisAcumZile !== undefined) expect(p.inchisAcumZile).toBeLessThan(c.clientDinAcumZile);
    }
  });

  it("link-urile sunt doar spre domenii de exemplu; nimic de test", () => {
    const url = C.flatMap((c) => c.proiecte.flatMap((p) => [...p.materiale.map((m) => m.url), ...p.livrari.map((l) => l.link)]));
    expect(url.every((u) => /exemplu/.test(u))).toBe(true);
    const text = JSON.stringify(C);
    expect(text).not.toMatch(/test|e2e|demo|lorem|parol[aă]:/i);
    expect(text).not.toMatch(/[şţŞŢ]/);
  });

  it("singur: doar Admin pe proiecte", () => {
    const S = clientiDemo({ acum, singur: true }).flatMap((c) => c.proiecte);
    expect(S.every((p) => p.procentRadu === undefined && p.taskuri.every((t) => t.om === "admin"))).toBe(true);
    expect(S.every((p) => p.materiale.every((m) => m.om === "admin") && p.notite.every((n) => n.autor === "admin"))).toBe(true);
  });
});

describe("firma demo: orele", () => {
  const ora = (d: Date) => Number(new Intl.DateTimeFormat("ro-RO", { timeZone: "Europe/Bucharest", hour: "numeric", hour12: false }).format(d));
  it("orice zi din trecut cade între 9 și 19, ora României, și în trecut", () => {
    for (const acumZile of [1, 1.08, 1.4, 2.95, 3.05, 12.6, 33.12, 80]) {
      const d = laOra(acum, acumZile);
      expect(ora(d)).toBeGreaterThanOrEqual(9);
      expect(ora(d)).toBeLessThan(19);
      expect(d.getTime()).toBeLessThan(acum.getTime());
    }
  });
  it("ce e mai vechi rămâne mai devreme", () => {
    const z = [80, 33.12, 12.6, 3.05, 2.95, 2.1, 1.4, 1.08, 1];
    const t = z.map((x) => laOra(acum, x).getTime());
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });
});
