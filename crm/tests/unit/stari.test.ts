import { describe, expect, it } from "vitest";
import { actiuniPermise, stareDupa, type LeadPentruActiune } from "@/lib/stari";
import { STARI } from "@/lib/tipuri";

const EU = "eu";
const ALTUL = "altul";
const liber: LeadPentruActiune = { stare: "nou", caller_id: null, closer_id: null };
const alMeu = (stare: LeadPentruActiune["stare"]): LeadPentruActiune => ({ stare, caller_id: EU, closer_id: null });

describe("actiuniPermise", () => {
  it("pe un lead liber, callerul și closerul au doar „ia_lead”", () => {
    expect(actiuniPermise(liber, "caller", EU)).toEqual(["ia_lead"]);
    expect(actiuniPermise(liber, "closer", EU)).toEqual(["ia_lead"]);
  });

  it("callerul nu are niciodată „client” sau „pierdut”", () => {
    for (const stare of STARI) {
      const a = actiuniPermise(alMeu(stare), "caller", EU);
      expect(a).not.toContain("client");
      expect(a).not.toContain("pierdut");
    }
  });

  it("„programeaza” lipsește pe „nou” și există după „A răspuns”", () => {
    expect(actiuniPermise(alMeu("nou"), "caller", EU)).not.toContain("programeaza");
    expect(actiuniPermise(alMeu("a_raspuns"), "caller", EU)).toContain("programeaza");
    expect(actiuniPermise(alMeu("callback"), "caller", EU)).toContain("programeaza");
    expect(actiuniPermise(alMeu("programat"), "caller", EU)).toContain("programeaza");
  });

  it("callerul nu are nimic pe lead-ul altuia", () => {
    expect(actiuniPermise({ stare: "nou", caller_id: ALTUL, closer_id: null }, "caller", EU)).toEqual([]);
  });

  it("closerul are „client” și „pierdut” pe lead-ul lui, și ca închizător", () => {
    expect(actiuniPermise(alMeu("programat"), "closer", EU)).toEqual(expect.arrayContaining(["client", "pierdut"]));
    const caCloser = { stare: "programat" as const, caller_id: ALTUL, closer_id: EU };
    expect(actiuniPermise(caCloser, "closer", EU)).toContain("client");
  });

  it("constructorul nu are nimic, nicăieri", () => {
    expect(actiuniPermise(liber, "constructor", EU)).toEqual([]);
    expect(actiuniPermise(alMeu("a_raspuns"), "constructor", EU)).toEqual([]);
  });

  it("pe un client, doar adminul mai poate face ceva", () => {
    expect(actiuniPermise({ stare: "client", caller_id: EU, closer_id: EU }, "closer", EU)).toEqual([]);
    expect(actiuniPermise({ stare: "client", caller_id: ALTUL, closer_id: null }, "admin", EU).length).toBeGreaterThan(0);
  });

  it("adminul are toate acțiunile pe lead-ul oricui", () => {
    const a = actiuniPermise({ stare: "nou", caller_id: ALTUL, closer_id: null }, "admin", EU);
    expect(a).toEqual(expect.arrayContaining(["nu_raspunde", "programeaza", "client", "pierdut", "descalificat"]));
  });
});

describe("stareDupa", () => {
  it("fiecare buton mută în starea lui", () => {
    expect(stareDupa("nu_raspunde")).toBe("fara_raspuns");
    expect(stareDupa("a_raspuns")).toBe("a_raspuns");
    expect(stareDupa("callback")).toBe("callback");
    expect(stareDupa("programeaza")).toBe("programat");
    expect(stareDupa("oferta_trimisa")).toBe("oferta_trimisa");
    expect(stareDupa("client")).toBe("client");
    expect(stareDupa("pierdut")).toBe("pierdut");
    expect(stareDupa("descalificat")).toBe("descalificat");
  });
});
