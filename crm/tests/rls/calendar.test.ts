import { afterAll, describe, expect, it } from "vitest";
import { admin, conecteazaCa, idDe, leadDeTest, omTemporar, sterge, stergeTemporari } from "./ajutor";


const lead: string[] = [];
const discutii: string[] = [];
const evenimente: string[] = [];
const run = Date.now();
const ev = (n: string) => {
  const id = `test-${run}-${n}`;
  evenimente.push(id);
  return id;
};

afterAll(async () => {
  for (const id of lead) await sterge(id);
  if (discutii.length) await admin().from("calendar_coada").delete().in("discutie_id", discutii);
  if (evenimente.length) await admin().from("calendar_coada").delete().in("event_id", evenimente);
  await admin().from("google_conexiuni").delete().eq("email", `test-${run}@exemplu.ro`);
  await stergeTemporari();
});

// o oră fixă, departe în viitor (sau în trecut), ca să nu se lovească de seed sau de alte rulări
const peste = (zile: number, ora: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + zile);
  d.setUTCHours(ora, 0, 0, 0);
  return d.toISOString();
};
const plus30 = (iso: string) => new Date(new Date(iso).getTime() + 30 * 60_000).toISOString();
const r = () => run % 97;

async function coada(discutieId: string) {
  const { data, error } = await admin().from("calendar_coada").select("*").eq("discutie_id", discutieId);
  if (error) throw error;
  return data as { actiune: string; om_id: string | null; event_id: string | null }[];
}

async function programeaza(zile: number, ora: number) {
  const l = await leadDeTest({ caller_id: await idDe("caller"), stare: "a_raspuns" });
  lead.push(l.id);
  const p = await (await conecteazaCa("caller")).rpc("programeaza_discutie", { p_lead: l.id, p_closer: await idDe("closer"), p_incepe: peste(zile, ora) });
  if (p.error) throw p.error;
  const { data } = await admin().from("discutii").select("id").eq("lead_id", l.id).single();
  discutii.push(data!.id);
  return { leadId: l.id, discutieId: data!.id as string };
}

/** O discuție pusă direct (și în trecut), fără „scrie” rămas în coadă. */
async function discutieDirecta(leadId: string, la: string, eventId: string | null) {
  const closer = await idDe("closer");
  const { data, error } = await admin().from("discutii").insert({ lead_id: leadId, closer_id: closer, incepe_la: la, sfarseste_la: plus30(la) }).select("id").single();
  if (error) throw error;
  discutii.push(data.id);
  if (eventId) await admin().from("discutii").update({ google_event_id: eventId, google_om_id: closer, calendar_stare: "ok" }).eq("id", data.id);
  await admin().from("calendar_coada").delete().eq("discutie_id", data.id);
  return data.id as string;
}

describe("calendarul: coada umplută de trigger-e", () => {
  it("programarea pune un „scrie” în coadă", async () => {
    const { discutieId } = await programeaza(140 + r(), 6);
    const c = await coada(discutieId);
    expect(c.map((x) => x.actiune)).toEqual(["scrie"]);
  });

  it("reprogramarea nu dublează „scrie”", async () => {
    const { leadId, discutieId: veche } = await programeaza(240 + r(), 6);
    const p = await (await conecteazaCa("caller")).rpc("programeaza_discutie", { p_lead: leadId, p_closer: await idDe("closer"), p_incepe: peste(240 + r(), 8) });
    expect(p.error).toBeNull();
    const { data } = await admin().from("discutii").select("id").eq("lead_id", leadId).single();
    discutii.push(data!.id);
    expect(await coada(veche)).toEqual([]);
    expect((await coada(data!.id)).filter((x) => x.actiune === "scrie")).toHaveLength(1);
  });

  it("schimbarea closerului cu eveniment pus", async () => {
    const closer = await idDe("closer");
    const closer2 = await omTemporar("closer");
    const { leadId, discutieId } = await programeaza(340 + r(), 6);
    const e = ev("ev1");
    await admin().from("discutii").update({ google_event_id: e, google_om_id: closer, calendar_stare: "ok" }).eq("id", discutieId);
    await admin().from("calendar_coada").delete().eq("discutie_id", discutieId);

    const s = await admin().from("lead_uri").update({ closer_id: closer2 }).eq("id", leadId);
    expect(s.error).toBeNull();

    const { data: st } = await admin().from("calendar_coada").select("actiune, om_id, event_id").eq("event_id", e);
    expect(st).toEqual([{ actiune: "sterge", om_id: closer, event_id: e }]);
    expect((await coada(discutieId)).map((x) => x.actiune)).toEqual(["scrie"]);
    const { data: d } = await admin().from("discutii").select("closer_id, google_event_id, google_om_id, calendar_stare").eq("id", discutieId).single();
    expect(d).toEqual({ closer_id: closer2, google_event_id: null, google_om_id: null, calendar_stare: null });
  });

  it("lead șters prin cascadă", async () => {
    const { leadId, discutieId } = await programeaza(440 + r(), 6);
    const e = ev("ev2");
    await admin().from("discutii").update({ google_event_id: e, google_om_id: await idDe("closer") }).eq("id", discutieId);
    await sterge(leadId);
    const { data: st } = await admin().from("calendar_coada").select("actiune").eq("event_id", e);
    expect(st).toEqual([{ actiune: "sterge" }]);
    expect(await coada(discutieId)).toEqual([]);
  });

  it("o discuție ștearsă fără eveniment nu lasă nimic în coadă", async () => {
    const { leadId, discutieId } = await programeaza(540 + r(), 6);
    await sterge(leadId);
    expect(await coada(discutieId)).toEqual([]);
  });

  it("anonimizarea șterge și evenimentele trecute", async () => {
    const l = await leadDeTest({ stare: "pierdut" });
    lead.push(l.id);
    const e1 = ev("trecut");
    const e2 = ev("viitor");
    await discutieDirecta(l.id, peste(-400 - r(), 6), e1);
    const viitoare = await discutieDirecta(l.id, peste(640 + r(), 6), e2);
    // un „scrie” în așteptare pentru discuția viitoare: anonimizarea trebuie să-l scoată
    await admin().from("lead_uri").update({ nume: "Încă are nume" }).eq("id", l.id);
    expect((await coada(viitoare)).map((x) => x.actiune)).toEqual(["scrie"]);
    const a = await admin().from("lead_uri").update({ anonimizat_la: new Date().toISOString(), nume: "Lead șters", telefon: null, telefon_norm: null }).eq("id", l.id);
    expect(a.error).toBeNull();
    const { data: st } = await admin().from("calendar_coada").select("actiune, event_id").in("event_id", [e1, e2]).order("event_id");
    expect(st!.map((x: { actiune: string }) => x.actiune)).toEqual(["sterge", "sterge"]);
    const { data: d } = await admin().from("discutii").select("google_event_id").eq("lead_id", l.id);
    expect(d!.every((x: { google_event_id: string | null }) => x.google_event_id === null)).toBe(true);
    expect(await coada(viitoare)).toEqual([]);
  });

  it("numele schimbat atinge doar viitorul", async () => {
    const l = await leadDeTest({ stare: "programat" });
    lead.push(l.id);
    const trecuta = await discutieDirecta(l.id, peste(-500 - r(), 6), ev("t2"));
    const viitoare = await discutieDirecta(l.id, peste(740 + r(), 6), ev("v2"));
    const u = await admin().from("lead_uri").update({ nume: "Alt nume" }).eq("id", l.id);
    expect(u.error).toBeNull();
    expect(await coada(trecuta)).toEqual([]);
    expect((await coada(viitoare)).map((x) => x.actiune)).toEqual(["scrie"]);
  });
});

describe("calendarul: re-armarea", () => {
  it("un „scrie” pus din nou își mută creat_la în prezent (regula celor 2 minute de pe fișă)", async () => {
    const { leadId, discutieId } = await programeaza(840 + r(), 6);
    const vechi = new Date(Date.now() - 10 * 60_000).toISOString();
    await admin().from("calendar_coada").update({ creat_la: vechi }).eq("discutie_id", discutieId);
    await admin().from("lead_uri").update({ nume: "Nume nou" }).eq("id", leadId);
    const [rand] = await admin().from("calendar_coada").select("creat_la, versiune").eq("discutie_id", discutieId).then((x) => x.data!);
    expect(new Date(rand.creat_la).getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(rand.versiune).toBe(1);
  });
});

describe("calendarul: cheile și stările", () => {
  it("nimeni nu citește cheile", async () => {
    const a = await conecteazaCa("admin");
    const k = await a.from("google_conexiuni").select();
    expect(k.error !== null || (k.data as unknown[]).length === 0).toBe(true);
    const c = await a.from("calendar_coada").select();
    expect(c.error !== null || (c.data as unknown[]).length === 0).toBe(true);
    const scris = await a.from("google_conexiuni").insert({ om_id: await idDe("admin"), email: "x@y.ro", refresh_criptat: "x" });
    expect(scris.error).not.toBeNull();
  });

  it("calendar_stari ascunde e-mailul", async () => {
    const closer = await idDe("closer");
    const email = `test-${run}@exemplu.ro`;
    await admin().from("google_conexiuni").delete().eq("om_id", closer);
    const p = await admin().from("google_conexiuni").insert({ om_id: closer, email, refresh_criptat: "v1.x.y.z" });
    expect(p.error).toBeNull();

    const rand = async (cont: "caller" | "closer" | "admin" | "constructor") => {
      const { data, error } = await (await conecteazaCa(cont)).rpc("calendar_stari");
      if (error) throw error;
      return data as { om_id: string; conectat: boolean; stare: string | null; email: string | null }[];
    };
    const laCaller = (await rand("caller")).find((x) => x.om_id === closer);
    expect(laCaller).toMatchObject({ conectat: true, stare: "ok", email: null });
    expect((await rand("closer")).find((x) => x.om_id === closer)?.email).toBe(email);
    expect((await rand("admin")).find((x) => x.om_id === closer)?.email).toBe(email);
    expect(await rand("constructor")).toEqual([]);
  });
});
