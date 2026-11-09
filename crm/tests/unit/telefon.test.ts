import { describe, expect, it } from "vitest";
import { linkTelefon, linkWhatsApp, normalizeazaEmail, normalizeazaTelefon } from "@/lib/telefon";

describe("normalizeazaTelefon", () => {
  it.each(["0721 123 456", "+40 721 123 456", "0040-721-123-456", "(0721) 123.456", "+40721123456"])("%s → 40721123456", (t) => {
    expect(normalizeazaTelefon(t)).toBe("40721123456");
  });
  it("păstrează prefixul altor țări", () => {
    expect(normalizeazaTelefon("+44 7911 123456")).toBe("447911123456");
  });
  it("respinge numerele prea scurte sau prea lungi", () => {
    expect(normalizeazaTelefon("123")).toBeNull();
    expect(normalizeazaTelefon("1234567890123456")).toBeNull();
    expect(normalizeazaTelefon("")).toBeNull();
  });
});

describe("normalizeazaEmail", () => {
  it("taie spațiile și face litere mici", () => {
    expect(normalizeazaEmail(" Ion@Gmail.COM ")).toBe("ion@gmail.com");
  });
  it("întoarce null fără „@”, gol sau lipsă", () => {
    expect(normalizeazaEmail("ion")).toBeNull();
    expect(normalizeazaEmail("  ")).toBeNull();
    expect(normalizeazaEmail(null)).toBeNull();
    expect(normalizeazaEmail(undefined)).toBeNull();
  });
});

describe("link-uri", () => {
  it("WhatsApp și telefon", () => {
    expect(linkWhatsApp("40721123456")).toBe("https://wa.me/40721123456");
    expect(linkTelefon("40721123456")).toBe("tel:+40721123456");
  });
});
