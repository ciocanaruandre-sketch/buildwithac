import { afterAll, describe, expect, it } from "vitest";
import { admin, clientDeTest, conecteazaCa, emailTest, idDe, omTemporar, stergeClient, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await stergeClient(id);
  await stergeTemporari();
});

async function client(camp: Parameters<typeof clientDeTest>[0] = {}) {
  const c = await clientDeTest(camp);
  lead_uri.push(c.lead.id);
  return c;
}

/** Pune un om pe proiect, cu cheia de serviciu. */
async function pune(proiectId: string, omId: string, procent: number | null = null) {
  const { error } = await admin().from("proiect_oameni").insert({ proiect_id: proiectId, om_id: omId, procent });
  if (error) throw error;
}

describe("proiecte", () => {
  it("lead-ul devine client → un client și exact un proiect, în «discutie», cu serviciul lead-ului", async () => {
    const { lead, clientId, proiectId } = await client({ serviciu: "automatizari" });
    const { data } = await admin().from("proiecte").select("id, stadiu, serviciu, titlu, pret_lei").eq("client_id", clientId);
    expect(data).toEqual([{ id: proiectId, stadiu: "discutie", serviciu: "automatizari", titlu: "Automatizări", pret_lei: null }]);

    // marcat din nou „Client”: nimic nu se dublează
    await admin().from("lead_uri").update({ stare: "oferta_trimisa" }).eq("id", lead.id);
    await admin().from("lead_uri").update({ stare: "client" }).eq("id", lead.id);
    expect((await admin().from("clienti").select("id").eq("lead_id", lead.id)).data).toHaveLength(1);
    expect((await admin().from("proiecte").select("id").eq("client_id", clientId)).data).toHaveLength(1);
  });

  it("proiectul nou apare în parcurs", async () => {
    const { proiectId } = await client({ serviciu: "site" });
    const { data } = await admin().from("evenimente_proiect").select("tip, detalii").eq("proiect_id", proiectId);
    expect(data).toEqual([{ tip: "proiect_creat", detalii: { titlu: "Site", serviciu: "site" } }]);
  });

  it("constructorul nepus pe proiect nu vede nici proiectul, nici clientul; pus pe proiect, le vede", async () => {
    const { clientId, proiectId } = await client();
    const c = await conecteazaCa("constructor");
    expect((await c.from("proiecte").select("id").eq("id", proiectId)).data).toEqual([]);
    expect((await c.from("clienti").select("id").eq("id", clientId)).data).toEqual([]);

    await pune(proiectId, await idDe("constructor"));
    expect((await c.from("proiecte").select("id").eq("id", proiectId)).data).toEqual([{ id: proiectId }]);
    expect((await c.from("clienti").select("id").eq("id", clientId)).data).toEqual([{ id: clientId }]);
  });

  it("constructorul de pe proiect schimbă stadiul (apare în parcurs), dar nu prețul", async () => {
    const { proiectId } = await client();
    await pune(proiectId, await idDe("constructor"));
    const c = await conecteazaCa("constructor");

    const s = await c.from("proiecte").update({ stadiu: "schita" }).eq("id", proiectId).select("stadiu");
    expect(s.error).toBeNull();
    expect(s.data).toEqual([{ stadiu: "schita" }]);
    const { data: ev } = await c.from("evenimente_proiect").select("tip, detalii, autor_id").eq("proiect_id", proiectId).eq("tip", "stadiu");
    expect(ev).toEqual([{ tip: "stadiu", detalii: { de: "discutie", in: "schita" }, autor_id: await idDe("constructor") }]);

    const p = await c.from("proiecte").update({ pret_lei: 1 }).eq("id", proiectId);
    expect(p.error?.message).toBe("Doar Adminul schimbă datele proiectului.");
    expect(p.error?.code).toBe("P0001");
  });

  it("proiectul închis nu-și mai schimbă stadiul din mâna constructorului", async () => {
    const { proiectId } = await client();
    await pune(proiectId, await idDe("constructor"));
    await admin().from("proiecte").update({ inchis_la: new Date().toISOString() }).eq("id", proiectId);
    const c = await conecteazaCa("constructor");
    const { error } = await c.from("proiecte").update({ stadiu: "livrat" }).eq("id", proiectId);
    expect(error?.message).toBe("Proiectul e închis.");
  });

  it("constructorul nu adaugă și nu șterge proiecte", async () => {
    const { clientId, proiectId } = await client();
    await pune(proiectId, await idDe("constructor"));
    const c = await conecteazaCa("constructor");
    const ins = await c.from("proiecte").insert({ client_id: clientId, titlu: "Al doilea", serviciu: "site" });
    expect(ins.error).not.toBeNull();
    const del = await c.from("proiecte").delete().eq("id", proiectId).select("id");
    expect(del.data ?? []).toHaveLength(0);
  });

  it("constructorul își vede doar rândul lui din proiect_oameni; oameni_proiect îi dă toți colegii", async () => {
    const { proiectId } = await client();
    const eu = await idDe("constructor");
    const c2 = await omTemporar("constructor");
    await pune(proiectId, eu, 30);
    await pune(proiectId, c2, 40);
    const c = await conecteazaCa("constructor");

    const { data } = await c.from("proiect_oameni").select("om_id, procent").eq("proiect_id", proiectId);
    expect(data).toEqual([{ om_id: eu, procent: 30 }]);
    const colegi = await c.rpc("oameni_proiect", { p: proiectId });
    expect(colegi.error).toBeNull();
    expect((colegi.data ?? []).map((r) => r.om_id).sort()).toEqual([eu, c2].sort());
  });

  it("constructorul nu-și schimbă singur procentul și nu se pune singur pe proiect", async () => {
    const { proiectId } = await client();
    const alt = await client();
    const eu = await idDe("constructor");
    await pune(proiectId, eu, 30);
    const c = await conecteazaCa("constructor");
    const u = await c.from("proiect_oameni").update({ procent: 90 }).eq("proiect_id", proiectId).eq("om_id", eu).select("procent");
    expect(u.data ?? []).toHaveLength(0);
    const i = await c.from("proiect_oameni").insert({ proiect_id: alt.proiectId, om_id: eu });
    expect(i.error).not.toBeNull();
  });

  it("oameni_proiect, cerut de un constructor din afara proiectului → niciun rând", async () => {
    const { proiectId } = await client();
    await pune(proiectId, await omTemporar("constructor"));
    const c = await conecteazaCa("constructor");
    const { data, error } = await c.rpc("oameni_proiect", { p: proiectId });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("pe proiect se pun doar constructori cu contul pornit", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const caller = await a.from("proiect_oameni").insert({ proiect_id: proiectId, om_id: await idDe("caller") });
    expect(caller.error?.message).toBe("Pe proiect se pun doar constructori cu contul pornit.");
    const oprit = await a.from("proiect_oameni").insert({ proiect_id: proiectId, om_id: await omTemporar("constructor", false) });
    expect(oprit.error?.message).toBe("Pe proiect se pun doar constructori cu contul pornit.");
    const bun = await a.from("proiect_oameni").insert({ proiect_id: proiectId, om_id: await idDe("constructor"), procent: 30 });
    expect(bun.error).toBeNull();
    const { data: ev } = await admin().from("evenimente_proiect").select("tip, detalii").eq("proiect_id", proiectId).eq("tip", "om_adaugat");
    expect(ev).toEqual([{ tip: "om_adaugat", detalii: { om: await idDe("constructor") } }]);
  });

  it("callerul nu vede proiectele, nici pe ale clientului lui", async () => {
    const { proiectId, clientId } = await client({ caller_id: await idDe("caller") });
    const c = await conecteazaCa("caller");
    expect((await c.from("clienti").select("id").eq("id", clientId)).data).toEqual([{ id: clientId }]);
    expect((await c.from("proiecte").select("id").eq("id", proiectId)).data).toEqual([]);
    expect((await c.from("evenimente_proiect").select("id").eq("proiect_id", proiectId)).data).toEqual([]);
  });

  it("constructorul vede din profiluri doar pe el, Adminii și colegii de proiect; programul closerilor deloc", async () => {
    const c = await conecteazaCa("constructor");
    const vazute = async () => ((await c.from("profiluri").select("email")).data ?? []).map((p) => p.email);
    const inainte = await vazute();
    expect(inainte).toContain(emailTest("admin"));
    expect(inainte).toContain(emailTest("constructor"));
    expect(inainte).not.toContain(emailTest("caller"));
    expect(inainte).not.toContain(emailTest("closer"));

    const { proiectId } = await client();
    const c2 = await omTemporar("constructor");
    const { data: p2 } = await admin().from("profiluri").select("email").eq("id", c2).single();
    expect(inainte).not.toContain(p2!.email);
    await pune(proiectId, await idDe("constructor"));
    await pune(proiectId, c2);
    expect(await vazute()).toContain(p2!.email);

    expect((await c.from("program_closer").select("id")).data).toEqual([]);
  });

  it("callerul vede în continuare toate profilurile și programul closerilor", async () => {
    const c = await conecteazaCa("caller");
    const emailuri = ((await c.from("profiluri").select("email")).data ?? []).map((p) => p.email);
    expect(emailuri).toContain(emailTest("closer"));
    expect(emailuri).toContain(emailTest("constructor"));
    expect(((await c.from("program_closer").select("id")).data ?? []).length).toBeGreaterThan(0);
  });
});
