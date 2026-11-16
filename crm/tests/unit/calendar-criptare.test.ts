import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cripteaza, decripteaza } from "@/lib/calendar/criptare";

const cheie = randomBytes(32).toString("base64");
const alta = randomBytes(32).toString("base64");

describe("criptarea cheii Google", () => {
  it("dus-întors dă același text", () => {
    const sir = cripteaza("1//refresh-token-ș", cheie);
    expect(sir.startsWith("v1.")).toBe(true);
    expect(decripteaza(sir, cheie)).toBe("1//refresh-token-ș");
  });

  it("două criptări ale aceluiași text dau șiruri diferite", () => {
    expect(cripteaza("r1", cheie)).not.toBe(cripteaza("r1", cheie));
  });

  it("cu altă cheie aruncă eroare", () => {
    expect(() => decripteaza(cripteaza("r1", cheie), alta)).toThrow();
  });

  it("un caracter schimbat aruncă eroare", () => {
    const sir = cripteaza("r1", cheie);
    const parti = sir.split(".");
    const d = parti[3];
    parti[3] = (d[0] === "A" ? "B" : "A") + d.slice(1);
    expect(() => decripteaza(parti.join("."), cheie)).toThrow();
  });

  it("fără cheie aruncă eroare", () => {
    const veche = process.env.GOOGLE_CHEIE_CRIPTARE;
    delete process.env.GOOGLE_CHEIE_CRIPTARE;
    try {
      expect(() => cripteaza("r1")).toThrow();
    } finally {
      if (veche !== undefined) process.env.GOOGLE_CHEIE_CRIPTARE = veche;
    }
  });
});
