import { describe, expect, it } from "vitest";
import { mesajDinBaza } from "@/lib/erori";

describe("mesajDinBaza", () => {
  it("mesajele noastre din trigger-e (P0001, în română) ajung la om", () => {
    expect(mesajDinBaza({ code: "P0001", message: "Proiectul e închis." }, "Nu s-a salvat.")).toBe("Proiectul e închis.");
  });
  it("orice altă eroare Postgres rămâne ascunsă", () => {
    expect(mesajDinBaza({ code: "42501", message: "new row violates row-level security policy" }, "Nu ai voie.")).toBe("Nu ai voie.");
    expect(mesajDinBaza({ code: "23514", message: 'violates check constraint "proiecte_pret_lei_check"' }, "Nu s-a salvat.")).toBe("Nu s-a salvat.");
    expect(mesajDinBaza({ message: "fetch failed" }, "Nu s-a salvat.")).toBe("Nu s-a salvat.");
  });
  it("fără eroare → mesajul implicit", () => {
    expect(mesajDinBaza(null, "x")).toBe("x");
  });
});
