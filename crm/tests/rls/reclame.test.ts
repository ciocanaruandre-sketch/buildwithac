import { afterAll, describe, expect, it } from "vitest";
import { admin, clientDeTest, conecteazaCa, leadDeTest, omTemporar, sterge, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
const reclame: string[] = [];
const run = Date.now().toString(36);
let k = 0;
/** Un nume de reclamă unic pe rulare, ca testele să nu se calce între ele. */
const nume = () => `Test ${run} ${k++}`;

afterAll(async () => {
  for (const id of lead_uri) await sterge(id);
  if (reclame.length) await admin().from("reclame").delete().in("id", reclame);
  await stergeTemporari();
});

async function lead(camp: Parameters<typeof leadDeTest>[0] = {}) {
  const l = await leadDeTest(camp);
  lead_uri.push(l.id);
  return l;
}

async function atribuie(leadId: string, n: string, platforma = "meta", campanie = "Campanie test") {
  const { data, error } = await admin().rpc("atribuie_reclama", { p_lead: leadId, p_platforma: platforma, p_campanie: campanie, p_nume: n });
  if (error) throw error;
  reclame.push(data);
  return data;
}

const legatura = async (leadId: string) => (await admin().from("reclame_lead_uri").select("*").eq("lead_id", leadId).maybeSingle()).data;

describe("reclamele", () => {
  it("doar Adminul vede și scrie reclamele", async () => {
    const l = await lead();
    await atribuie(l.id, nume());
    for (const cont of ["caller", "closer", "constructor"] as const) {
      const db = await conecteazaCa(cont);
      expect((await db.from("reclame").select("id")).data).toEqual([]);
      expect((await db.from("reclame_lead_uri").select("id")).data).toEqual([]);
      const ins = await db.from("reclame").insert({ platforma: "meta", nume: nume() }).select();
      expect(ins.error ?? ins.data?.length === 0).toBeTruthy();
      expect((await db.rpc("atribuie_reclama", { p_lead: l.id, p_platforma: "meta", p_campanie: "", p_nume: nume() })).error).not.toBeNull();
    }
    const db = await conecteazaCa("admin");
    const ins = await db.from("reclame").insert({ platforma: "tiktok", nume: nume(), cheltuit_lei: 100 }).select("id").single();
    expect(ins.error).toBeNull();
    reclame.push(ins.data!.id);
    expect((await db.from("reclame_lead_uri").select("id").eq("lead_id", l.id)).data).toHaveLength(1);
  });

  it("atribuirea face reclama o dată și leagă lead-ul", async () => {
    const n = nume();
    const a = await lead();
    const b = await lead();
    const r1 = await atribuie(a.id, n);
    const r2 = await atribuie(b.id, n);
    expect(r2).toBe(r1);
    expect((await admin().from("reclame").select("id").eq("nume", n)).data).toHaveLength(1);
    expect((await admin().from("reclame_lead_uri").select("id").eq("reclama_id", r1)).data).toHaveLength(2);
    // același lead de două ori: o singură legătură
    await atribuie(a.id, n);
    expect((await admin().from("reclame_lead_uri").select("id").eq("reclama_id", r1)).data).toHaveLength(2);
  });

  it("o discuție programată se numără și rămâne după reprogramare", async () => {
    const l = await lead({ stare: "programat" });
    await atribuie(l.id, nume());
    const closer = await omTemporar("closer");
    const incepe = new Date(Date.now() + 400 * 86_400_000);
    const d = await admin()
      .from("discutii")
      .insert({ lead_id: l.id, closer_id: closer, incepe_la: incepe.toISOString(), sfarseste_la: new Date(incepe.getTime() + 1_800_000).toISOString() })
      .select("id")
      .single();
    if (d.error) throw d.error;
    expect((await legatura(l.id))?.a_avut_discutie).toBe(true);
    await admin().from("discutii").delete().eq("id", d.data.id);
    expect((await legatura(l.id))?.a_avut_discutie).toBe(true);
  });

  it("lead-ul devenit client", async () => {
    const l = await lead({ stare: "programat" });
    await atribuie(l.id, nume());
    await admin().from("lead_uri").update({ stare: "client" }).eq("id", l.id);
    const c = await admin().from("clienti").select("id").eq("lead_id", l.id).single();
    const r = await legatura(l.id);
    expect(r?.client).toBe(true);
    expect(r?.client_id).toBe(c.data!.id);
  });

  it("cron-ul șterge lead-ul, cifrele rămân", async () => {
    const l = await leadDeTest();
    const r = await atribuie(l.id, nume());
    const rand = await legatura(l.id);
    await admin().from("lead_uri").delete().eq("id", l.id);
    const dupa = await admin().from("reclame_lead_uri").select("*").eq("id", rand!.id).single();
    expect(dupa.data).toMatchObject({ reclama_id: r, lead_id: null });
  });

  it("Adminul șterge lead-ul de mână, iese din cifre", async () => {
    const l = await leadDeTest();
    await atribuie(l.id, nume());
    const rand = await legatura(l.id);
    const db = await conecteazaCa("admin");
    const s = await db.from("lead_uri").delete().eq("id", l.id);
    expect(s.error).toBeNull();
    expect((await admin().from("reclame_lead_uri").select("id").eq("id", rand!.id)).data).toEqual([]);
  });

  it("clientul șters își lasă banii la reclamă, fără legătură spre el", async () => {
    const c = await clientDeTest();
    lead_uri.push(c.lead.id);
    // clientul s-a făcut înainte de atribuire: îl legăm ca trigger-ul (client = true, client_id)
    const r = await atribuie(c.lead.id, nume());
    await admin().from("reclame_lead_uri").update({ client: true, client_id: c.clientId }).eq("lead_id", c.lead.id);
    const rand = await legatura(c.lead.id);
    const azi = new Date().toISOString().slice(0, 10);
    const t = await admin()
      .from("transe")
      .insert([
        { proiect_id: c.proiectId, tip: "odata", eticheta: "Tot", suma_lei: 2000, scadenta: azi, incasata_la: azi, incasat_lei: 2000, returnat_lei: 500, returnata_la: azi },
        { proiect_id: c.proiectId, tip: "inainte", eticheta: "Înainte", suma_lei: 1000, scadenta: azi, incasata_la: azi, incasat_lei: 1000, returnat_lei: 0 },
        { proiect_id: c.proiectId, tip: "rest", eticheta: "Rest", suma_lei: 700, scadenta: azi, returnat_lei: 0 },
      ]);
    if (t.error) throw t.error;
    const db = await conecteazaCa("admin");
    const s = await db.rpc("sterge_client", { c: c.clientId });
    expect(s.error).toBeNull();
    const dupa = await admin().from("reclame_lead_uri").select("*").eq("id", rand!.id).single();
    expect(dupa.data).toMatchObject({ reclama_id: r, incasat_sters_lei: 1500, client_id: null, lead_id: null, client: true });
  });

  it("reclame_cifre: pâlnia și banii, inclusiv clientul șters", async () => {
    const n = nume();
    const azi = new Date().toISOString().slice(0, 10);
    // un lead fără nimic, unul cu discuție
    const simplu = await lead();
    const r = await atribuie(simplu.id, n);
    const cuDiscutie = await lead();
    await atribuie(cuDiscutie.id, n);
    await admin().from("reclame_lead_uri").update({ a_avut_discutie: true }).eq("lead_id", cuDiscutie.id);
    // un client cu 2.000 încasați și 800 de încasat; altul cu 1.500 încasați, apoi șters
    const client = async () => {
      const l = await lead({ stare: "programat" });
      await atribuie(l.id, n);
      await admin().from("lead_uri").update({ stare: "client" }).eq("id", l.id);
      const c = await admin().from("clienti").select("id, proiecte (id)").eq("lead_id", l.id).single();
      return { clientId: c.data!.id, proiectId: c.data!.proiecte[0].id };
    };
    const viu = await client();
    const t = await admin()
      .from("transe")
      .insert([
        { proiect_id: viu.proiectId, tip: "avans", eticheta: "Avans", suma_lei: 2000, scadenta: azi, incasata_la: azi, incasat_lei: 2000, returnat_lei: 0 },
        { proiect_id: viu.proiectId, tip: "rest", eticheta: "Rest", suma_lei: 800, scadenta: azi, returnat_lei: 0 },
      ]);
    if (t.error) throw t.error;
    const sters = await client();
    const t2 = await admin().from("transe").insert({ proiect_id: sters.proiectId, tip: "odata", eticheta: "Tot", suma_lei: 1500, scadenta: azi, incasata_la: azi, incasat_lei: 1500 });
    if (t2.error) throw t2.error;
    const s = await (await conecteazaCa("admin")).rpc("sterge_client", { c: sters.clientId });
    expect(s.error).toBeNull();

    const db = await conecteazaCa("admin");
    const { data, error } = await db.rpc("reclame_cifre");
    expect(error).toBeNull();
    expect(data!.find((x) => x.id === r)).toMatchObject({ nume: n, platforma: "meta", cheltuit_lei: null, lead_uri: 4, discutii: 3, clienti: 2, incasat_lei: 3500, mai_vin_lei: 800 });
    expect((await (await conecteazaCa("constructor")).rpc("reclame_cifre")).data).toEqual([]);
  });

  it("uneste_reclame: lead-urile și cheltuiala trec la cea păstrată", async () => {
    const [a, b, c] = [await lead(), await lead(), await lead()];
    const ra = await atribuie(a.id, nume());
    const nb = nume();
    const rb = await atribuie(b.id, nb);
    await admin().from("reclame").update({ cheltuit_lei: 200 }).eq("id", rb);
    const db = await conecteazaCa("admin");
    for (const cont of ["caller", "closer", "constructor"] as const) {
      expect((await (await conecteazaCa(cont)).rpc("uneste_reclame", { p_pastrata: ra, p_unita: rb })).error).not.toBeNull();
    }
    expect((await db.rpc("uneste_reclame", { p_pastrata: ra, p_unita: ra })).error).not.toBeNull();
    const tt = await atribuie(c.id, nume(), "tiktok");
    expect((await db.rpc("uneste_reclame", { p_pastrata: ra, p_unita: tt })).error?.message).toBe("Poți uni doar reclame de pe aceeași platformă.");

    expect((await db.rpc("uneste_reclame", { p_pastrata: ra, p_unita: rb })).error).toBeNull();
    const cifre = (await db.rpc("reclame_cifre")).data!;
    expect(cifre.find((x) => x.id === ra)).toMatchObject({ lead_uri: 2, cheltuit_lei: 200 });
    expect(cifre.find((x) => x.id === rb)).toBeUndefined();
    // un lead nou cu numele vechi ajunge la cea păstrată
    const d = await lead();
    expect(await atribuie(d.id, nb)).toBe(ra);
    // gol + gol = gol
    const [e, f] = [await lead(), await lead()];
    const re = await atribuie(e.id, nume());
    const rf = await atribuie(f.id, nume());
    expect((await db.rpc("uneste_reclame", { p_pastrata: re, p_unita: rf })).error).toBeNull();
    expect((await db.rpc("reclame_cifre")).data!.find((x) => x.id === re)?.cheltuit_lei).toBeNull();
  });

  it("Adminul nu poate șterge o reclamă cu lead-uri, nici ocolind aplicația", async () => {
    const l = await lead();
    const r = await atribuie(l.id, nume());
    const db = await conecteazaCa("admin");
    const s = await db.from("reclame").delete().eq("id", r);
    expect(s.error?.message).toBe("Reclama are lead-uri. Unește-o cu alta în loc s-o ștergi.");
    expect((await admin().from("reclame").select("id").eq("id", r)).data).toHaveLength(1);
    // fără lead-uri, se șterge
    const ins = await db.from("reclame").insert({ platforma: "meta", nume: nume() }).select("id").single();
    expect((await db.from("reclame").delete().eq("id", ins.data!.id)).error).toBeNull();
  });

  it("clientul șters direct, fără sterge_client, își lasă tot banii la reclamă", async () => {
    const c = await clientDeTest();
    lead_uri.push(c.lead.id);
    await atribuie(c.lead.id, nume());
    await admin().from("reclame_lead_uri").update({ client: true, client_id: c.clientId }).eq("lead_id", c.lead.id);
    const rand = await legatura(c.lead.id);
    const azi = new Date().toISOString().slice(0, 10);
    const t = await admin()
      .from("transe")
      .insert({ proiect_id: c.proiectId, tip: "odata", eticheta: "Tot", suma_lei: 900, scadenta: azi, incasata_la: azi, incasat_lei: 900, returnat_lei: 0 });
    if (t.error) throw t.error;
    await admin().from("clienti").delete().eq("id", c.clientId);
    const dupa = await admin().from("reclame_lead_uri").select("*").eq("id", rand!.id).single();
    expect(dupa.data).toMatchObject({ incasat_sters_lei: 900, client_id: null });
  });

  it("reclame_pastreaza_banii nu mai poate fi chemată", async () => {
    const db = await conecteazaCa("admin");
    const { error } = await db.rpc("reclame_pastreaza_banii" as "reclame_cifre", { c: "00000000-0000-0000-0000-000000000000" } as never);
    expect(error).not.toBeNull();
  });

  it("proiecte nu mai are incasat_lei", async () => {
    const { error } = await admin().from("proiecte").select("incasat_lei" as "id").limit(1);
    expect(error).not.toBeNull();
  });
});
