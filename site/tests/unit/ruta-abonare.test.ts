import { describe, it, expect, vi, beforeEach } from "vitest";

const aboneaza = vi.fn();
vi.mock("@/lib/kit", () => ({ aboneaza: (...a: unknown[]) => aboneaza(...a) }));
const { POST } = await import("@/app/api/abonare/route");

const cerere = (corp: object, antete: Record<string, string> = { origin: "https://buildwithac.ro", host: "buildwithac.ro" }) =>
  new Request("https://buildwithac.ro/api/abonare", { method: "POST", headers: { "Content-Type": "application/json", ...antete }, body: JSON.stringify(corp) });

describe("POST /api/abonare", () => {
  beforeEach(() => { aboneaza.mockReset(); aboneaza.mockResolvedValue("ok"); });

  it("o cerere normală ajunge la Kit", async () => {
    const r = await POST(cerere({ email: "ana@exemplu.ro" }));
    expect(r.status).toBe(200);
    expect(aboneaza).toHaveBeenCalledOnce();
  });

  it("câmpul-capcană completat → răspunde ok, dar nu trimite nimic la Kit", async () => {
    const r = await POST(cerere({ email: "ana@exemplu.ro", website: "http://spam" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ stare: "ok" });
    expect(aboneaza).not.toHaveBeenCalled();
  });

  it("cerere de pe alt site → 403, fără Kit", async () => {
    const r = await POST(cerere({ email: "ana@exemplu.ro" }, { origin: "https://rau.example", host: "buildwithac.ro" }));
    expect(r.status).toBe(403);
    expect(aboneaza).not.toHaveBeenCalled();
  });

  it("cerere fără Origin (script) → 403, fără Kit", async () => {
    const r = await POST(cerere({ email: "ana@exemplu.ro" }, { host: "buildwithac.ro" }));
    expect(r.status).toBe(403);
    expect(aboneaza).not.toHaveBeenCalled();
  });
});
