import { afterAll, describe, expect, it } from "vitest";
import { POST as intrareSite } from "@/app/api/intrare/site/route";
import { primesteCerere, type CerereNoua } from "@/lib/intrare";
import { admin, sterge } from "./ajutor";

const deSters: string[] = [];
const run = Date.now().toString(36);
afterAll(async () => {
  for (const id of deSters) await sterge(id);
  await admin().from("reclame").delete().like("campanie", `Test intrare ${run}%`);
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

describe("intrarea din reclame", () => {
  const camp = (x: string) => `Test intrare ${run} ${x}`;
  async function trimite(telefon: string, utm: Record<string, string>) {
    process.env.CRM_SECRET_INTRARE = "secret-test-intrare";
    const r = await intrareSite(
      new Request("http://x/api/intrare/site", {
        method: "POST",
        headers: { Authorization: "Bearer secret-test-intrare", "Content-Type": "application/json" },
        body: JSON.stringify({ nume: "Din reclamă", telefon, serviciu: "site", utm }),
      }),
    );
    expect(r.status).toBe(200);
    const { id } = (await r.json()) as { id: string };
    if (!deSters.includes(id)) deSters.push(id);
    return id;
  }
  const tel = () => `0798${unic().slice(-6)}`;
  const legatura = async (leadId: string) =>
    (await admin().from("reclame_lead_uri").select("reclama_id, reclame(nume, campanie, platforma)").eq("lead_id", leadId).maybeSingle()).data;
  const sursa = async (leadId: string) => (await admin().from("lead_uri").select("sursa").eq("id", leadId).single()).data!.sursa;

  it("/api/intrare/site din reclamă Meta → sursa Reclamă Meta, legat de reclamă", async () => {
    const id = await trimite(tel(), { utm_source: "ig", utm_medium: "reclama", utm_campaign: camp("meta"), utm_content: "Clip cafenea" });
    expect(await sursa(id)).toBe("reclama_meta");
    expect(await legatura(id)).toMatchObject({ reclame: { nume: "Clip cafenea", campanie: camp("meta"), platforma: "meta" } });
  });

  it("link organic cu utm_source=instagram → Formular site, fără reclamă, UTM păstrat", async () => {
    const utm = { utm_source: "instagram", utm_campaign: camp("bio") };
    const id = await trimite(tel(), utm);
    expect(await sursa(id)).toBe("formular_site");
    expect(await legatura(id)).toBeNull();
    const { data } = await admin().from("cereri").select("utm").eq("lead_id", id).single();
    expect(data!.utm).toEqual(utm);
  });

  it("omul care există deja trimite din reclamă → nu se leagă, sursa rămâne", async () => {
    const t = tel();
    const id = await trimite(t, {});
    const a2 = await trimite(t, { utm_source: "fb", utm_medium: "reclama", utm_campaign: camp("existent"), utm_content: "Carusel" });
    expect(a2).toBe(id);
    expect(await sursa(id)).toBe("formular_site");
    expect(await legatura(id)).toBeNull();
    expect((await admin().from("reclame").select("id").eq("campanie", camp("existent"))).data).toEqual([]);
  });

  it("un client care trimite din reclamă → nu se leagă, rămâne client", async () => {
    const t = tel();
    const id = await trimite(t, {});
    await admin().from("lead_uri").update({ stare: "programat" }).eq("id", id);
    await admin().from("lead_uri").update({ stare: "client" }).eq("id", id);
    const a2 = await trimite(t, { utm_source: "ig", utm_medium: "reclama", utm_campaign: camp("client"), utm_content: "Clip" });
    expect(a2).toBe(id);
    expect((await admin().from("lead_uri").select("stare").eq("id", id).single()).data!.stare).toBe("client");
    expect(await legatura(id)).toBeNull();
    expect((await admin().from("reclame").select("id").eq("campanie", camp("client"))).data).toEqual([]);
    await admin().from("clienti").delete().eq("lead_id", id);
  });

  it("aceeași reclamă cu nume lung → o singură reclamă", async () => {
    const utm = { utm_source: "tiktok", utm_medium: "reclama", utm_campaign: camp("lung"), utm_content: "ș".repeat(150) };
    const a = await trimite(tel(), utm);
    const b = await trimite(tel(), utm);
    const { data } = await admin().from("reclame").select("id, nume").eq("campanie", camp("lung"));
    expect(data).toHaveLength(1);
    expect(data![0].nume).toBe("ș".repeat(120));
    expect((await legatura(a))!.reclama_id).toBe(data![0].id);
    expect((await legatura(b))!.reclama_id).toBe(data![0].id);
  });

  it("reclama unită primește lead-urile cu numele vechi", async () => {
    const { data: a } = await admin().from("reclame").insert({ platforma: "meta", campanie: camp("unita"), nume: "Nume nou" }).select("id").single();
    await admin().from("reclame").insert({ platforma: "meta", campanie: camp("unita"), nume: "Nume vechi", unita_in: a!.id });
    const id = await trimite(tel(), { utm_source: "fb", utm_medium: "reclama", utm_campaign: camp("unita"), utm_content: "Nume vechi" });
    expect((await legatura(id))!.reclama_id).toBe(a!.id);
  });
});
