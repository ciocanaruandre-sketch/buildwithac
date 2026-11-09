import { describe, it, expect, vi } from "vitest";
import { verificaCerere, construiesteEmail, trimiteCerere, type CerereContact } from "@/lib/contact";

const buna = { nume: "Maria Popescu", telefon: "0721123456", serviciu: "site", descriere: "" };
const greseli = (d: unknown) => {
  const r = verificaCerere(d);
  return "greseli" in r ? r.greseli : [];
};

describe("verificaCerere", () => {
  it("acceptă o cerere bună și curăță spațiile", () => {
    const r = verificaCerere({ nume: "  Maria Popescu ", telefon: " +40 721 123 456 ", serviciu: "site", descriere: "  " });
    expect(r).toEqual({ cerere: { nume: "Maria Popescu", telefon: "+40 721 123 456", serviciu: "site", descriere: "" } });
  });

  it.each(["+40 721 123 456", "0040-721-123-456", "(0721) 123.456", "+44 7911 123456", "0721123456"])("telefon valid: %s", (telefon) => {
    expect(greseli({ ...buna, telefon })).toEqual([]);
  });

  it.each(["", "072112", "+40 721 123 456 789 01", "0721abc456", "0721+123456"])("telefon respins: %s", (telefon) => {
    expect(greseli({ ...buna, telefon })).toEqual(["telefon"]);
  });

  it.each(["", " a ", "x".repeat(81)])("nume respins: %j", (nume) => {
    expect(greseli({ ...buna, nume })).toEqual(["nume"]);
  });

  it("parametrii din link (utm) se păstrează curățați, iar unii greșiți nu strică cererea", () => {
    const r = verificaCerere({ ...buna, utm: { utm_source: "meta", rau: "x" } });
    expect(r).toEqual({ cerere: { ...buna, utm: { utm_source: "meta" } } });
    expect(greseli({ ...buna, utm: 5 })).toEqual([]);
    expect(greseli({ ...buna, utm: ["x"] })).toEqual([]);
    expect(verificaCerere({ ...buna, utm: 5 })).toEqual({ cerere: buna });
  });

  it("numele cu diacritice sau emoji trece", () => {
    expect(greseli({ ...buna, nume: "Ștefan 🙂" })).toEqual([]);
  });

  it.each([undefined, "ghid", "SITE"])("serviciu respins: %j", (serviciu) => {
    expect(greseli({ ...buna, serviciu })).toEqual(["serviciu"]);
  });

  it("descrierea are cel mult 1.000 de caractere", () => {
    expect(greseli({ ...buna, descriere: "a".repeat(1000) })).toEqual([]);
    expect(greseli({ ...buna, descriere: "a".repeat(1001) })).toEqual(["descriere"]);
  });

  it("descrierea lipsă devine șir gol", () => {
    const fara = { nume: buna.nume, telefon: buna.telefon, serviciu: buna.serviciu };
    expect(verificaCerere(fara)).toEqual({ cerere: { ...buna, descriere: "" } });
  });

  it("date stricate nu aruncă excepții", () => {
    expect(greseli(null)).toEqual(["nume", "telefon", "serviciu"]);
    expect(greseli("x")).toEqual(["nume", "telefon", "serviciu"]);
    expect(greseli({ nume: 5 })).toEqual(["nume", "telefon", "serviciu"]);
    expect(greseli({ ...buna, descriere: 7 })).toEqual(["descriere"]);
  });

  it("toate greșelile apar odată, în ordinea câmpurilor", () => {
    expect(greseli({ nume: "", telefon: "1", serviciu: "x", descriere: "a".repeat(1001) })).toEqual(["nume", "telefon", "serviciu", "descriere"]);
  });
});

describe("construiesteEmail", () => {
  const c: CerereContact = { nume: "Maria Popescu", telefon: "+40 721 123 456", serviciu: "site", descriere: "" };
  const acum = new Date("2026-11-03T10:00:00Z");

  it("subiectul are serviciul și numele", () => {
    expect(construiesteEmail(c, acum).subiect).toBe("Cerere nouă: Site · Maria Popescu");
    expect(construiesteEmail({ ...c, serviciu: "1la1" }, acum).subiect).toBe("Cerere nouă: Sesiune 1 la 1 sau ghid personalizat · Maria Popescu");
  });

  it("subiectul rămâne pe un singur rând", () => {
    expect(construiesteEmail({ ...c, nume: "Maria\r\nBcc: x@y.ro" }, acum).subiect).not.toMatch(/[\r\n]/);
  });

  it("telefonul e link tel: doar cu + și cifre", () => {
    expect(construiesteEmail(c, acum).html).toContain('href="tel:+40721123456"');
  });

  it("textul omului e escapat în HTML", () => {
    const { html, text } = construiesteEmail({ ...c, descriere: "<script>alert(1)</script> & \"x\"" }, acum);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(text).toContain("<script>alert(1)</script>");
  });

  it("descrierea goală apare ca „fără descriere”", () => {
    const { html, text } = construiesteEmail(c, acum);
    expect(text).toContain("fără descriere");
    expect(html).toContain("fără descriere");
  });

  it("cu lead-ul în CRM, e-mailul are linkul la fișă", () => {
    const { html, text } = construiesteEmail(c, acum, { id: "abc" });
    expect(text).toContain("https://crm.buildwithac.ro/lead-uri/abc");
    expect(html).toContain('href="https://crm.buildwithac.ro/lead-uri/abc"');
  });

  it("când CRM-ul n-a primit lead-ul, e-mailul o spune clar", () => {
    const { html, text } = construiesteEmail(c, acum, null);
    expect(text).toContain("ATENȚIE: lead-ul n-a intrat în CRM. Adaugă-l de mână.");
    expect(html).toContain("n-a intrat în CRM");
  });

  it("fără CRM configurat, e-mailul nu pomenește CRM-ul", () => {
    expect(construiesteEmail(c, acum).text).not.toContain("CRM");
  });

  it("ora e cea din București", () => {
    expect(construiesteEmail(c, acum).text).toContain("12:00");
  });
});

describe("trimiteCerere", () => {
  const c: CerereContact = { nume: "Maria Popescu", telefon: "0721123456", serviciu: "site", descriere: "" };
  const acum = new Date("2026-11-03T10:00:00Z");
  const raspuns = (status: number) => vi.fn(async () => new Response("{}", { status }));

  it("fără cheie → indisponibil, fără nicio cerere", async () => {
    const f = raspuns(200);
    expect(await trimiteCerere(c, {}, f as unknown as typeof fetch)).toBe("indisponibil");
    expect(f).not.toHaveBeenCalled();
  });

  it("Resend 200 → ok, cu expeditorul, destinatarul și e-mailul construit", async () => {
    const f = raspuns(200);
    expect(await trimiteCerere(c, { cheie: "re_test" }, f as unknown as typeof fetch, 8000, acum)).toBe("ok");
    expect(f).toHaveBeenCalledOnce();
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const { subiect, text, html } = construiesteEmail(c, acum);
    expect(JSON.parse(String(init.body))).toEqual({
      from: "Site buildwithac <formular@buildwithac.ro>",
      to: ["contact@buildwithac.ro"],
      subject: subiect,
      text,
      html,
    });
  });

  it.each([401, 422, 429, 500])("Resend %i → indisponibil", async (status) => {
    expect(await trimiteCerere(c, { cheie: "re_test" }, raspuns(status) as unknown as typeof fetch)).toBe("indisponibil");
  });

  it("timp depășit → indisponibil", async () => {
    const f = vi.fn(async () => { throw new DOMException("timeout", "AbortError"); });
    expect(await trimiteCerere(c, { cheie: "re_test" }, f as unknown as typeof fetch)).toBe("indisponibil");
  });
});
