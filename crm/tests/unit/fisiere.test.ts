import { describe, expect, it } from "vitest";
import { MARIME_MAXIMA, desfaCalea, etichetaFisier, marimeCitibila, numeCurat } from "@/lib/fisiere";

describe("numeCurat", () => {
  it("spațiile și semnele devin cratime, extensia rămâne", () => {
    expect(numeCurat("Poze meniu (24).zip")).toBe("Poze-meniu-24.zip");
  });
  it("nu lasă drumuri în nume", () => {
    expect(numeCurat("../../etc/passwd")).toBe("etc-passwd");
    expect(numeCurat(String.raw`C:\Users\ana\oferta.pdf`)).toBe("C-Users-ana-oferta.pdf");
  });
  it("diacriticele devin litere simple, extensia cu litere mici", () => {
    expect(numeCurat("Șablon ofertă.PDF")).toBe("Sablon-oferta.pdf");
    expect(numeCurat("țânțar îngheţat.png")).toBe("tantar-inghetat.png");
  });
  it("fără nimic folositor → „fisier”", () => {
    expect(numeCurat("")).toBe("fisier");
    expect(numeCurat("...")).toBe("fisier");
    expect(numeCurat("???.png")).toBe("fisier.png");
  });
  it("cel mult 80 de caractere, cu extensia păstrată", () => {
    const n = numeCurat("a".repeat(300) + ".png");
    expect(n).toHaveLength(80);
    expect(n.endsWith(".png")).toBe(true);
  });
});

describe("marimea și eticheta", () => {
  it("marimeCitibila", () => {
    expect(marimeCitibila(900)).toBe("900 B");
    expect(marimeCitibila(2048)).toBe("2 KB");
    expect(marimeCitibila(1_258_291)).toBe("1,2 MB");
    expect(marimeCitibila(MARIME_MAXIMA)).toBe("25 MB");
  });
  it("limita e de 25 MB", () => {
    expect(MARIME_MAXIMA).toBe(25 * 1024 * 1024);
  });
  it("etichetaFisier: după extensie", () => {
    expect(etichetaFisier("oferta.pdf")).toBe("PDF");
    expect(etichetaFisier("poze.zip")).toBe("ZIP");
    expect(etichetaFisier("poza.JPG")).toBe("IMG");
    expect(etichetaFisier("logo.webp")).toBe("IMG");
    expect(etichetaFisier("texte.txt")).toBe("FIȘ");
    expect(etichetaFisier("faraextensie")).toBe("FIȘ");
  });
});

describe("desfaCalea", () => {
  const p = "0861e4a2-1111-4222-8333-444455556666";
  const d = "9f2b7c10-aaaa-4bbb-8ccc-ddddeeeeffff";
  it("o cale făcută de noi: proiect / dosar / nume curat", () => {
    expect(desfaCalea(`${p}/${d}/Poze-meniu-24.zip`)).toEqual({ proiectId: p, dosar: `${p}/${d}`, nume: "Poze-meniu-24.zip" });
  });
  it("orice altceva e refuzat", () => {
    for (const c of [`${p}/Poze.zip`, `${p}/${d}/a/b.zip`, `${p}/${d}/../x.zip`, `${p}/${d}/`, `aiurea/${d}/x.zip`, `${p}/${d}/nume cu spatii.zip`, ""]) {
      expect(desfaCalea(c), c).toBeNull();
    }
  });
});
