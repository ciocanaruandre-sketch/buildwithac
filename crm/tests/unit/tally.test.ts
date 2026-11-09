import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dinTally, verificaSemnaturaTally } from "@/lib/tally";
import fixture from "./fixtures/tally-site.json";

const SECRET = "secret-de-test";
const semneaza = (corp: string) => createHmac("sha256", SECRET).update(corp).digest("base64");

describe("verificaSemnaturaTally", () => {
  const corp = JSON.stringify(fixture);

  it("acceptă semnătura corectă", () => {
    expect(verificaSemnaturaTally(corp, semneaza(corp), SECRET)).toBe(true);
  });
  it("acceptă și corpul trimis cu alte spații (Tally semnează JSON-ul re-serializat)", () => {
    const cuSpatii = JSON.stringify(fixture, null, 2);
    expect(verificaSemnaturaTally(cuSpatii, semneaza(corp), SECRET)).toBe(true);
  });
  it("respinge un corp schimbat", () => {
    const schimbat = corp.replace("Elena Marin", "Elena Marim");
    expect(verificaSemnaturaTally(schimbat, semneaza(corp), SECRET)).toBe(false);
  });
  it("respinge lipsa antetului sau a secretului", () => {
    expect(verificaSemnaturaTally(corp, null, SECRET)).toBe(false);
    expect(verificaSemnaturaTally(corp, semneaza(corp), "")).toBe(false);
  });
  it("un corp care nu e JSON se verifică pe textul lui", () => {
    expect(verificaSemnaturaTally("nu e json", semneaza("nu e json"), SECRET)).toBe(true);
    expect(verificaSemnaturaTally("nu e json", "abc", SECRET)).toBe(false);
  });
});

describe("dinTally", () => {
  const c = dinTally(fixture)!;

  it("știe formularul: sursa și serviciul", () => {
    expect(c.sursa).toBe("tally_site");
    expect(c.serviciu).toBe("site");
  });
  it("găsește numele, telefonul și e-mailul", () => {
    expect(c.nume).toBe("Elena Marin");
    expect(c.telefon).toBe("+40700000099");
    expect(c.email).toBe("Elena@Exemplu.ro");
  });
  it("câmpurile ascunse utm_* merg în utm, nu în răspunsuri", () => {
    expect(c.utm).toEqual({ utm_source: "meta", utm_campaign: "site-nov" });
    expect(c.raspunsuri.some((r) => r.intrebare.startsWith("utm_"))).toBe(false);
  });
  it("opțiunile alese se scriu cu textul lor, fără sub-câmpurile da/nu", () => {
    expect(c.raspunsuri).toContainEqual({ intrebare: "De ce ai nevoie?", raspuns: "Logo, Texte" });
    expect(c.raspunsuri).toContainEqual({ intrebare: "Buget", raspuns: "500–1.500 €" });
    expect(c.raspunsuri.some((r) => r.intrebare.includes("(Logo)"))).toBe(false);
  });
  it("păstrează răspunsurile text și sare peste cele goale", () => {
    expect(c.raspunsuri).toContainEqual({ intrebare: "Ce afacere ai?", raspuns: "Cafenea în Cluj" });
    expect(c.raspunsuri.some((r) => r.intrebare === "Altceva de adăugat?")).toBe(false);
  });
  it("idExtern e responseId", () => {
    expect(c.idExtern).toBe("rsp_test_01");
  });
  it("un formular necunoscut sau un corp ciudat dă null", () => {
    expect(dinTally({ ...fixture, data: { ...fixture.data, formId: "altceva" } })).toBeNull();
    expect(dinTally(null)).toBeNull();
    expect(dinTally({ data: { formId: "Qo1xzg", fields: "nu" } })).toBeNull();
  });
  it("fără un câmp care să conțină „nume”, ia primul text", () => {
    const fields = fixture.data.fields.map((f) => (f.label === "Numele tău" ? { ...f, label: "Cine ești?" } : f));
    const altul = dinTally({ ...fixture, data: { ...fixture.data, fields } })!;
    expect(altul.nume).toBe("Elena Marin");
  });
  it("fără niciun câmp de text, numele e „Fără nume”", () => {
    const fields = fixture.data.fields.filter((f) => f.type !== "INPUT_TEXT");
    expect(dinTally({ ...fixture, data: { ...fixture.data, fields } })!.nume).toBe("Fără nume");
  });
});
