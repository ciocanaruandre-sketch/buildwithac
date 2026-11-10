import { afterAll, describe, expect, it } from "vitest";
import { POST as intrareSite } from "@/app/api/intrare/site/route";
import { primesteCerere, type CerereNoua } from "@/lib/intrare";
import { admin, sterge } from "./ajutor";

const deSters: string[] = [];
afterAll(async () => {
  for (const id of deSters) await sterge(id);
});

let n = 0;
const unic = () => `${Date.now().toString().slice(-6)}${n++}`;
const cerere = (camp: Partial<CerereNoua> = {}): CerereNoua => ({
  nume: "Test Intrare",
  telefon: null,
  email: null,
  serviciu: "site",
  sursa: "reclama_meta",
  raspunsuri: [{ intrebare: "Ce vrei?", raspuns: "Un site" }],
  utm: {},
  idExtern: null,
  ...camp,
});

describe("primesteCerere", () => {
  it("același om, telefon scris diferit → un lead, două cereri", async () => {
    const national = `79${unic().padStart(7, "0").slice(-7)}`; // 9 cifre, fără 0
    const a = await primesteCerere(cerere({ telefon: `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}` }), admin());
    deSters.push(a.id);
    const b = await primesteCerere(cerere({ telefon: `+40 ${national}`, sursa: "formular_site" }), admin());
    expect(a.decizie).toBe("lead_nou");
    expect(b.decizie).toBe("leaga_de_lead");
    expect(b.id).toBe(a.id);
    const { data } = await admin().from("cereri").select("id").eq("lead_id", a.id);
    expect(data).toHaveLength(2);
    const { data: ev } = await admin().from("evenimente").select("tip").eq("lead_id", a.id).eq("tip", "cerere_noua");
    expect(ev).toHaveLength(1);
  });

  it("același id extern de două ori → a doua oară „duplicat”, nimic scris", async () => {
    const idExtern = `rsp_${unic()}`;
    const email = `dublu${unic()}@exemplu.ro`;
    const a = await primesteCerere(cerere({ email, idExtern }), admin());
    deSters.push(a.id);
    const b = await primesteCerere(cerere({ email, idExtern }), admin());
    expect(b.decizie).toBe("duplicat");
    const { data } = await admin().from("cereri").select("id").eq("lead_id", a.id);
    expect(data).toHaveLength(1);
  });

  it("un lead pierdut care revine se redeschide, cu cele 90 de zile de la zero", async () => {
    const email = `revine${unic()}@exemplu.ro`;
    const vechi = new Date(Date.now() - 40 * 86_400_000).toISOString();
    const { data: l } = await admin()
      .from("lead_uri")
      .insert({ nume: "Revine", email, email_norm: email, serviciu: "site", sursa: "reclama_meta", stare: "pierdut", motiv: "Prea scump", intrat_la: vechi })
      .select()
      .single();
    deSters.push(l!.id);
    const r = await primesteCerere(cerere({ email: email.toUpperCase() }), admin());
    expect(r).toMatchObject({ id: l!.id, decizie: "redeschide" });
    const { data: dupa } = await admin().from("lead_uri").select("stare, intrat_la, motiv").eq("id", l!.id).single();
    expect(dupa!.stare).toBe("nou");
    expect(dupa!.motiv).toBeNull();
    expect(new Date(dupa!.intrat_la).getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("fără telefon și fără e-mail nu scrie nimic și spune de ce", async () => {
    await expect(primesteCerere(cerere(), admin())).rejects.toThrow(/telefon/);
  });
});

describe("rutele de intrare", () => {
  it("/api/intrare/site fără secret → 401", async () => {
    const r = await intrareSite(new Request("http://x/api/intrare/site", { method: "POST", body: "{}" }));
    expect(r.status).toBe(401);
  });

  it("/api/intrare/site cu secret și date bune → 200 cu id", async () => {
    process.env.CRM_SECRET_INTRARE = "secret-test-intrare";
    const tel = `0799${unic().slice(-6)}`;
    const r = await intrareSite(
      new Request("http://x/api/intrare/site", {
        method: "POST",
        headers: { Authorization: "Bearer secret-test-intrare", "Content-Type": "application/json" },
        body: JSON.stringify({ nume: "Din site", telefon: tel, serviciu: "automatizari", descriere: "Vreau programări automate", utm: { utm_source: "tiktok" } }),
      }),
    );
    expect(r.status).toBe(200);
    const { id } = await r.json();
    deSters.push(id);
    const { data } = await admin().from("cereri").select("sursa, raspunsuri, utm").eq("lead_id", id).single();
    expect(data).toEqual({ sursa: "formular_site", raspunsuri: [{ intrebare: "Descriere", raspuns: "Vreau programări automate" }], utm: { utm_source: "tiktok" } });
  });

  it("/api/intrare/site cu date greșite → 400", async () => {
    process.env.CRM_SECRET_INTRARE = "secret-test-intrare";
    const r = await intrareSite(
      new Request("http://x/api/intrare/site", { method: "POST", headers: { Authorization: "Bearer secret-test-intrare" }, body: JSON.stringify({ nume: "x", serviciu: "nimic" }) }),
    );
    expect(r.status).toBe(400);
  });
});
