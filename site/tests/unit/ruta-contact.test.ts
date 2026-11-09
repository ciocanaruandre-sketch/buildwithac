import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const trimiteCerere = vi.fn();
vi.mock("@/lib/contact", async (original) => ({
  ...(await original<typeof import("@/lib/contact")>()),
  trimiteCerere: (...a: unknown[]) => trimiteCerere(...a),
}));
const trimiteLaCrm = vi.fn();
vi.mock("@/lib/crm", () => ({ trimiteLaCrm: (...a: unknown[]) => trimiteLaCrm(...a) }));
const { POST } = await import("@/app/api/contact/route");

const DIN_SITE = { origin: "https://buildwithac.ro", host: "buildwithac.ro" };
const buna = { nume: "Maria Popescu", telefon: "0721 123 456", serviciu: "site", descriere: "" };
const cerere = (corp: object | string, antete: Record<string, string> = DIN_SITE) =>
  new Request("https://buildwithac.ro/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...antete },
    body: typeof corp === "string" ? corp : JSON.stringify(corp),
  });

describe("POST /api/contact", () => {
  beforeEach(() => { trimiteCerere.mockReset(); trimiteCerere.mockResolvedValue("ok"); });

  it("o cerere bună pleacă la Resend → 200 ok", async () => {
    const r = await POST(cerere(buna));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ stare: "ok" });
    expect(trimiteCerere).toHaveBeenCalledOnce();
    expect(trimiteCerere.mock.calls[0][0]).toEqual({ ...buna, telefon: "0721 123 456" });
    expect(trimiteCerere.mock.calls[0][1]).toEqual({ cheie: process.env.RESEND_API_KEY });
  });

  it("capcana completată → ok, fără trimitere", async () => {
    const r = await POST(cerere({ ...buna, website: "http://spam" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ stare: "ok" });
    expect(trimiteCerere).not.toHaveBeenCalled();
  });

  it("de pe alt site → 403, fără trimitere", async () => {
    const r = await POST(cerere(buna, { origin: "https://rau.example", host: "buildwithac.ro" }));
    expect(r.status).toBe(403);
    expect(trimiteCerere).not.toHaveBeenCalled();
  });

  it("fără Origin → 403, fără trimitere", async () => {
    const r = await POST(cerere(buna, { host: "buildwithac.ro" }));
    expect(r.status).toBe(403);
    expect(trimiteCerere).not.toHaveBeenCalled();
  });

  it("telefon greșit → 400 cu câmpul", async () => {
    const r = await POST(cerere({ ...buna, telefon: "12" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ stare: "invalid", camp: "telefon" });
    expect(trimiteCerere).not.toHaveBeenCalled();
  });

  it("corp care nu e JSON → 400 invalid, nu 500", async () => {
    const r = await POST(cerere("nu e json"));
    expect(r.status).toBe(400);
    expect((await r.json()).stare).toBe("invalid");
  });

  it("Resend indisponibil → 503", async () => {
    trimiteCerere.mockResolvedValue("indisponibil");
    const r = await POST(cerere(buna));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ stare: "indisponibil" });
  });
});

describe("POST /api/contact cu CRM-ul", () => {
  beforeEach(() => {
    trimiteCerere.mockReset();
    trimiteCerere.mockResolvedValue("ok");
    trimiteLaCrm.mockReset();
    process.env.CRM_SECRET_INTRARE = "secret";
  });
  afterEach(() => {
    delete process.env.CRM_SECRET_INTRARE;
  });

  it("trimite întâi la CRM, cu utm-ul, apoi e-mailul cu linkul la fișă", async () => {
    trimiteLaCrm.mockResolvedValue({ id: "lead-1" });
    const r = await POST(cerere({ ...buna, utm: { utm_source: "meta" } }));
    expect(r.status).toBe(200);
    expect(trimiteLaCrm.mock.calls[0][0]).toEqual({ ...buna, utm: { utm_source: "meta" } });
    expect(trimiteCerere.mock.calls[0][1]).toEqual({ cheie: process.env.RESEND_API_KEY, crm: { id: "lead-1" } });
  });

  it("CRM-ul nu răspunde, Resend merge → 200 ok, iar e-mailul are avertismentul", async () => {
    trimiteLaCrm.mockResolvedValue(null);
    const r = await POST(cerere(buna));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ stare: "ok" });
    expect(trimiteCerere.mock.calls[0][1].crm).toBeNull();
  });

  it("CRM-ul merge, Resend cade → tot 200 ok (lead-ul nu e pierdut)", async () => {
    trimiteLaCrm.mockResolvedValue({ id: "lead-2" });
    trimiteCerere.mockResolvedValue("indisponibil");
    const r = await POST(cerere(buna));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ stare: "ok" });
  });

  it("amândouă cad → 503", async () => {
    trimiteLaCrm.mockResolvedValue(null);
    trimiteCerere.mockResolvedValue("indisponibil");
    const r = await POST(cerere(buna));
    expect(r.status).toBe(503);
  });

  it("fără secretul CRM-ului, nu încearcă deloc CRM-ul", async () => {
    delete process.env.CRM_SECRET_INTRARE;
    await POST(cerere(buna));
    expect(trimiteLaCrm).not.toHaveBeenCalled();
    expect(trimiteCerere.mock.calls[0][1].crm).toBeUndefined();
  });
});
