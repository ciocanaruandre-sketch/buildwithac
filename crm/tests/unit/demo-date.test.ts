import { describe, expect, it } from "vitest";
import { normalizeazaTelefon } from "../../lib/telefon";
import { clientiDemo, discutiiDemo, laCallback, laOra, laOraRomaniei, leaduriDemo, telefonDemo, telefonNormDemo } from "../../scripts/date/demo-date";

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

  it("singur: notițele nu pomenesc echipa", () => {
    const S = leaduriDemo({ acum, singur: true });
    const texte = S.flatMap((l) => l.notite.map((n) => n.text));
    expect(texte.filter((t) => /\b(Ioana|Mara|Vlad|Radu)\b/.test(t))).toEqual([]);
    const P = clientiDemo({ acum, singur: true }).flatMap((c) => c.proiecte.flatMap((p) => p.notite.map((n) => n.text)));
    expect(P.filter((t) => /\b(Ioana|Mara|Vlad|Radu)\b/.test(t))).toEqual([]);
  });

  it("telefoanele nu se ciocnesc cu seed-ul (0700 000 …) și cu e2e (0733 111 222)", () => {
    const t = L.map((l) => telefonDemo(l.nr));
    expect(t.some((x) => x.startsWith("0700") || x === "0733 111 222")).toBe(false);
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
  it("callback-urile cad în orele de lucru, oricând ar rula demo-ul", () => {
    for (const ruleaza of ["2026-11-12T19:00:00Z", "2026-11-12T05:30:00Z", "2026-07-14T18:30:00Z", "2026-11-12T10:00:00Z"]) {
      for (const ore of [5, 22, -2, 47, -20]) {
        const d = laCallback(new Date(ruleaza), ore);
        expect(ora(d)).toBeGreaterThanOrEqual(9);
        expect(ora(d)).toBeLessThan(18);
        expect(Math.sign(d.getTime() - new Date(ruleaza).getTime())).toBe(Math.sign(ore));
      }
    }
  });

  it("14:00 ora României e 14:00 și vara, și iarna", () => {
    expect(laOraRomaniei(new Date("2026-07-14T08:00:00Z"), 14, 0).toISOString()).toBe("2026-07-14T11:00:00.000Z");
    expect(laOraRomaniei(new Date("2026-11-12T08:00:00Z"), 14, 0).toISOString()).toBe("2026-11-12T12:00:00.000Z");
  });

  it("ce e mai vechi rămâne mai devreme", () => {
    const z = [80, 33.12, 12.6, 3.05, 2.95, 2.1, 1.4, 1.08, 1];
    const t = z.map((x) => laOra(acum, x).getTime());
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });
});

const PREFIXE = ["0721", "0722", "0723", "0724", "0726", "0730", "0731", "0740", "0742", "0744", "0745", "0746", "0747", "0748", "0749", "0751", "0752", "0753", "0754", "0755", "0756", "0757", "0758", "0760", "0761", "0762", "0763", "0764", "0765", "0766", "0767", "0768", "0769"];

describe("firma demo: telefoanele (modul filmare)", () => {
  it("sunt variate, credibile, unice și la fel la fiecare rulare", () => {
    const t = L.map((l) => telefonDemo(l.nr));
    expect(t.every((x) => /^07\d{2} \d{3} \d{3}$/.test(x))).toBe(true);
    expect(t.every((x) => PREFIXE.includes(x.slice(0, 4)))).toBe(true);
    expect(t.some((x) => x.startsWith("0700"))).toBe(false);
    expect(new Set(t).size).toBe(t.length);
    expect(new Set(t.map((x) => x.slice(0, 4))).size).toBeGreaterThanOrEqual(10);
    expect(leaduriDemo({ acum, singur: false }).map((l) => telefonDemo(l.nr))).toEqual(t);
  });

  it("forma normalizată se potrivește cu cea afișată (căutarea după telefon)", () => {
    for (const l of L) expect(telefonNormDemo(l.nr)).toBe(normalizeazaTelefon(telefonDemo(l.nr)));
  });
});

describe("firma demo: textul liber (modul filmare)", () => {
  const ECHIPA = ["Andrei", "Mara", "Vlad", "Ioana", "Radu"];
  const escapa = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cuvant = (s: string, flags = "") => new RegExp(`(?<![\\p{L}\\d])${escapa(s)}(?![\\p{L}\\d])`, `u${flags}`);

  it("nu conține numele, firma sau telefonul unui lead ori client", () => {
    const C = clientiDemo({ acum, singur: false });
    const texte: string[] = [
      ...L.flatMap((l) => [...l.notite.map((n) => n.text), ...(l.raspunsuri ?? []).map((r) => r.raspuns), JSON.stringify(l.parcurs)]),
      ...C.flatMap((c) =>
        c.proiecte.flatMap((p) => [
          p.titlu,
          ...p.taskuri.map((t) => t.titlu),
          ...p.materiale.flatMap((m) => [m.titlu, m.nota ?? ""]),
          ...p.conturi.map((x) => x.serviciu),
          ...p.livrari.flatMap((x) => [x.titlu, x.nota ?? ""]),
          ...p.notite.map((n) => n.text),
          JSON.stringify(p.parcurs),
        ]),
      ),
    ];
    const gasite: string[] = [];
    for (const l of L) {
      const [om, firma] = l.nume.split("·").map((s) => s.trim());
      const cautate = [
        ...om.split(/\s+/).filter((p) => p.length >= 3 && !ECHIPA.includes(p)).map((p) => cuvant(p)),
        ...(firma ? [cuvant(firma, "i")] : []),
        cuvant(telefonDemo(l.nr)),
        cuvant(telefonDemo(l.nr).replace(/\s/g, "")),
      ];
      for (const t of texte) for (const r of cautate) if (r.test(t)) gasite.push(`${r.source} în „${t.slice(0, 80)}”`);
    }
    expect(gasite).toEqual([]);
  });
});
