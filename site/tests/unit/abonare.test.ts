import { describe, it, expect, vi } from "vitest";
import { aboneaza } from "@/lib/kit";

const ENV = { cheie: "k", formular: "123" };
const raspuns = (status: number) => new Response("{}", { status });

describe("aboneaza", () => {
  it("email invalid → invalid, fără apel fetch", async () => {
    const f = vi.fn();
    expect(await aboneaza("nu-e-email", ENV, f)).toBe("invalid");
    expect(f).not.toHaveBeenCalled();
  });

  it("fără cheie → indisponibil, fără apel fetch", async () => {
    const f = vi.fn();
    expect(await aboneaza("ana@exemplu.ro", { formular: "123" }, f)).toBe("indisponibil");
    expect(f).not.toHaveBeenCalled();
  });

  it("Kit 201 → ok: creează abonatul inactiv, apoi îl adaugă la formular", async () => {
    const f = vi.fn().mockResolvedValueOnce(raspuns(201)).mockResolvedValueOnce(raspuns(201));
    expect(await aboneaza(" Ana@Exemplu.ro ", ENV, f)).toBe("ok");
    expect(f).toHaveBeenCalledTimes(2);
    const [url1, init1] = f.mock.calls[0];
    expect(url1).toBe("https://api.kit.com/v4/subscribers");
    expect(init1.headers["X-Kit-Api-Key"]).toBe("k");
    expect(JSON.parse(init1.body)).toEqual({ email_address: "ana@exemplu.ro", state: "inactive" });
    const [url2, init2] = f.mock.calls[1];
    expect(url2).toBe("https://api.kit.com/v4/forms/123/subscribers");
    expect(JSON.parse(init2.body)).toEqual({ email_address: "ana@exemplu.ro" });
  });

  it("abonat existent (200) → ok", async () => {
    const f = vi.fn().mockResolvedValueOnce(raspuns(200)).mockResolvedValueOnce(raspuns(200));
    expect(await aboneaza("ana@exemplu.ro", ENV, f)).toBe("ok");
  });

  it("Kit 422 la creare → invalid", async () => {
    const f = vi.fn().mockResolvedValueOnce(raspuns(422));
    expect(await aboneaza("ana@exemplu.ro", ENV, f)).toBe("invalid");
  });

  it("Kit 500 → indisponibil", async () => {
    const f = vi.fn().mockResolvedValueOnce(raspuns(201)).mockResolvedValueOnce(raspuns(500));
    expect(await aboneaza("ana@exemplu.ro", ENV, f)).toBe("indisponibil");
  });

  it("fetch aruncă → indisponibil", async () => {
    const f = vi.fn().mockRejectedValue(new Error("rețea"));
    expect(await aboneaza("ana@exemplu.ro", ENV, f)).toBe("indisponibil");
  });

  it("Kit nu răspunde → indisponibil, după limita de timp", async () => {
    // fetch-ul nu se termină niciodată singur; se oprește doar când expiră semnalul
    const f = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_, respinge) => {
      init.signal?.addEventListener("abort", () => respinge(init.signal!.reason));
    }));
    expect(await aboneaza("ana@exemplu.ro", ENV, f as unknown as typeof fetch, 20)).toBe("indisponibil");
  }, 2000);
});
