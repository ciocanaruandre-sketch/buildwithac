import { describe, expect, it } from "vitest";
import { linkTelefon, linkWhatsapp, normalizeazaTelefon } from "@/lib/telefon";
import { FIRMA } from "@/lib/config";

describe("telefonul", () => {
  it.each(["0722 123 456", "+40 722 123 456", "0040722123456", "0722.123.456", "0722-123-456", "722123456"])(
    "normalizează %s",
    (t) => expect(normalizeazaTelefon(t)).toBe("+40722123456"),
  );
  it("fix București", () => expect(normalizeazaTelefon("021 123 4567")).toBe("+40211234567"));
  it.each(["", "0722 123", "0722 123 456 789", "abc", "+44 20 7946 0958"])("refuză %s", (t) =>
    expect(() => normalizeazaTelefon(t)).toThrow("Telefon nevalid"),
  );
  it("link de apel", () => expect(linkTelefon("0722 123 456")).toBe("tel:+40722123456"));
  it("WhatsApp fără și cu mesaj", () => {
    expect(linkWhatsapp("0722 123 456")).toBe("https://wa.me/40722123456");
    expect(linkWhatsapp("0722 123 456", "Bună, aș vrea o programare")).toBe(
      "https://wa.me/40722123456?text=Bun%C4%83%2C%20a%C8%99%20vrea%20o%20programare",
    );
  });
  it("datele firmei au telefoane valide", () => {
    expect(() => normalizeazaTelefon(FIRMA.telefon)).not.toThrow();
    if (FIRMA.whatsapp) expect(() => normalizeazaTelefon(FIRMA.whatsapp!)).not.toThrow();
  });
});
