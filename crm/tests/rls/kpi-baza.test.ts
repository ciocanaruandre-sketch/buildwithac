import { afterAll, describe, expect, it } from "vitest";
import { admin, conecteazaCa, idDe, leadDeTest, omTemporar, sterge, stergeTemporari } from "./ajutor";

const deSters: string[] = [];
afterAll(async () => {
  for (const id of deSters) await sterge(id);
  await stergeTemporari();
});

const ziInUrma = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const minute = (n: number) => new Date(Date.now() + n * 60_000).toISOString();

/** O discuție de un minut, cu cheia de serviciu; minutele diferite țin discuțiile closerului să nu se suprapună. */
async function discutie(lead_id: string, closer_id: string, laMinut: number) {
  const { data, error } = await admin()
    .from("discutii")
    .insert({ lead_id, closer_id, incepe_la: minute(laMinut), sfarseste_la: minute(laMinut + 1) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

describe("lead-ul fără nume", () => {
  it("anonimizeaza_vechi scoate datele personale și păstrează Parcursul", async () => {
    const vechi = await leadDeTest({ stare: "pierdut", motiv: "Prea scump, are buget mic", intrat_la: ziInUrma(366) });
    const recent = await leadDeTest({ stare: "pierdut", intrat_la: ziInUrma(364) });
    const client = await leadDeTest({ stare: "client", intrat_la: ziInUrma(400) });
    deSters.push(vechi.id, recent.id, client.id);
    const c = await admin().from("cereri").insert({ lead_id: vechi.id, sursa: "formular_site" });
    expect(c.error).toBeNull();
    const n0 = await admin().from("notite").insert({ lead_id: vechi.id, autor_id: null, text: "Are buget mic" });
    expect(n0.error).toBeNull();
    const ev = await admin()
      .from("evenimente")
      .insert({ lead_id: vechi.id, tip: "stare", detalii: { de: "programat", in: "pierdut", motiv: "Prea scump, are buget mic" } })
      .select("id")
      .single();
    expect(ev.error).toBeNull();

    const r = await admin().rpc("anonimizeaza_vechi", { zile: 365 });
    expect(r.error).toBeNull();
    expect(r.data).toBeGreaterThanOrEqual(1);

    const { data: l } = await admin().from("lead_uri").select("*").eq("id", vechi.id).single();
    expect(l?.nume).toBe("Lead șters");
    expect(l?.telefon).toBeNull();
    expect(l?.telefon_norm).toBeNull();
    expect(l?.email_norm).toBeNull();
    expect(l?.motiv).toBeNull();
    expect(l?.anonimizat_la).not.toBeNull();
    expect((await admin().from("cereri").select("id").eq("lead_id", vechi.id)).data).toHaveLength(0);
    expect((await admin().from("notite").select("id").eq("lead_id", vechi.id)).data).toHaveLength(0);
    const { data: e } = await admin().from("evenimente").select("detalii").eq("id", ev.data!.id).single();
    expect(e?.detalii).toEqual({ de: "programat", in: "pierdut" });

    const { data: alte } = await admin().from("lead_uri").select("id, nume, anonimizat_la").in("id", [recent.id, client.id]);
    for (const x of alte ?? []) {
      expect(x.nume).toBe("Test RLS");
      expect(x.anonimizat_la).toBeNull();
    }
  });

  it("lead-ul fără nume nu se vede pentru nimeni din echipă", async () => {
    const l = await leadDeTest({ stare: "descalificat", intrat_la: ziInUrma(370) });
    deSters.push(l.id);
    expect((await admin().rpc("anonimizeaza_vechi", { zile: 365 })).error).toBeNull();
    for (const cont of ["admin", "caller", "closer"] as const) {
      const { data, error } = await (await conecteazaCa(cont)).from("lead_uri").select("id").eq("id", l.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    }
  });

  it("același telefon, după anonimizare, se poate folosi la un lead nou", async () => {
    const l = await leadDeTest({ stare: "pierdut", intrat_la: ziInUrma(380) });
    deSters.push(l.id);
    expect((await admin().rpc("anonimizeaza_vechi", { zile: 365 })).error).toBeNull();
    const nou = await leadDeTest({ telefon: l.telefon, telefon_norm: l.telefon_norm });
    deSters.push(nou.id);
    expect(nou.id).not.toBe(l.id);
  });
});

describe("„N-a venit”", () => {
  it("closerul marchează N-a venit doar pe discuția lui, începută", async () => {
    const closer = await idDe("closer");
    const l = await leadDeTest({ stare: "programat", closer_id: closer, caller_id: await idDe("caller") });
    deSters.push(l.id);
    const db = await conecteazaCa("closer");

    const viitoare = await discutie(l.id, closer, 60 * 24 * 50 + 7);
    const r1 = await db.rpc("marcheaza_neprezentat", { d: viitoare, da: true });
    expect(r1.error?.message).toBe("Discuția n-a început încă.");
    await admin().from("discutii").delete().eq("id", viitoare);

    const altCloser = await omTemporar("closer");
    const alt = await leadDeTest({ stare: "programat", closer_id: altCloser });
    deSters.push(alt.id);
    const aAltuia = await discutie(alt.id, altCloser, -13);
    const r2 = await db.rpc("marcheaza_neprezentat", { d: aAltuia, da: true });
    expect(r2.error?.message).toBe("Doar closerul discuției o marchează.");

    const d = await discutie(l.id, closer, -10);
    const r3 = await db.rpc("marcheaza_neprezentat", { d, da: true });
    expect(r3.error).toBeNull();
    const { data: dupa } = await admin().from("lead_uri").select("stare, callback_la, closer_id").eq("id", l.id).single();
    expect(dupa?.stare).toBe("callback");
    // ceasul bazei poate fi cu un minut-două înaintea celui local: callback-ul e „acum”, nu în viitor
    expect(new Date(dupa!.callback_la!).getTime()).toBeLessThanOrEqual(Date.now() + 10 * 60_000);
    expect(dupa?.closer_id).toBe(closer);
    const { data: ev } = await admin().from("evenimente").select("tip, autor_id, detalii").eq("lead_id", l.id).eq("tip", "neprezentat");
    expect(ev).toHaveLength(1);
    expect(ev![0].autor_id).toBe(closer);
    expect((ev![0].detalii as { discutie: string }).discutie).toBe(d);
    const { data: ds } = await admin().from("discutii").select("neprezentat_la").eq("id", d).single();
    expect(ds?.neprezentat_la).not.toBeNull();

    // a doua oară nu mai scrie nimic
    expect((await db.rpc("marcheaza_neprezentat", { d, da: true })).error).toBeNull();
    const { data: ev2 } = await admin().from("evenimente").select("id").eq("lead_id", l.id).eq("tip", "neprezentat");
    expect(ev2).toHaveLength(1);
  });

  it("N-a venit nu mută lead-ul dacă are deja altă discuție viitoare", async () => {
    const closer = await idDe("closer");
    const l = await leadDeTest({ stare: "programat", closer_id: closer });
    deSters.push(l.id);
    const d = await discutie(l.id, closer, -20);
    await discutie(l.id, closer, 60 * 24 * 51 + 17);
    expect((await (await conecteazaCa("closer")).rpc("marcheaza_neprezentat", { d, da: true })).error).toBeNull();
    const { data } = await admin().from("lead_uri").select("stare").eq("id", l.id).single();
    expect(data?.stare).toBe("programat");
  });

  it("anularea golește neprezentat_la și întoarce lead-ul în Programat, fără apel în cifre", async () => {
    const closer = await idDe("closer");
    const l = await leadDeTest({ stare: "programat", closer_id: closer });
    deSters.push(l.id);
    const d = await discutie(l.id, closer, -30);
    const db = await conecteazaCa("closer");
    expect((await db.rpc("marcheaza_neprezentat", { d, da: true })).error).toBeNull();
    expect((await db.rpc("marcheaza_neprezentat", { d, da: false })).error).toBeNull();
    const { data: ds } = await admin().from("discutii").select("neprezentat_la").eq("id", d).single();
    expect(ds?.neprezentat_la).toBeNull();
    const { data: lead } = await admin().from("lead_uri").select("stare, callback_la").eq("id", l.id).single();
    expect(lead).toEqual({ stare: "programat", callback_la: null });
    const { data: ev } = await admin().from("evenimente").select("tip").eq("lead_id", l.id).order("id");
    // „N-a venit” și anularea rămân în Parcurs; mutările de stare dintre ele, nu
    expect(ev!.map((e) => e.tip)).toEqual(["creat", "neprezentat", "neprezentat_anulat"]);
  });

  it("anularea nu mută lead-ul dacă s-a lucrat pe el după „N-a venit”", async () => {
    const closer = await idDe("closer");
    const l = await leadDeTest({ stare: "programat", closer_id: closer });
    deSters.push(l.id);
    const d = await discutie(l.id, closer, -35);
    const db = await conecteazaCa("closer");
    expect((await db.rpc("marcheaza_neprezentat", { d, da: true })).error).toBeNull();
    const cb = new Date(Date.now() + 2 * 86_400_000).toISOString();
    expect((await admin().from("lead_uri").update({ callback_la: cb }).eq("id", l.id)).error).toBeNull();
    expect((await db.rpc("marcheaza_neprezentat", { d, da: false })).error).toBeNull();
    const { data: lead } = await admin().from("lead_uri").select("stare").eq("id", l.id).single();
    expect(lead?.stare).toBe("callback");
  });

  it("callerul nu poate marca N-a venit", async () => {
    const closer = await idDe("closer");
    const l = await leadDeTest({ stare: "programat", closer_id: closer, caller_id: await idDe("caller") });
    deSters.push(l.id);
    const d = await discutie(l.id, closer, -40);
    const r = await (await conecteazaCa("caller")).rpc("marcheaza_neprezentat", { d, da: true });
    expect(r.error?.message).toBe("Doar closerul discuției o marchează.");
  });
});

describe("categoria motivului", () => {
  it("evenimentul stare are categoria motivului", async () => {
    const l = await leadDeTest({ stare: "programat" });
    deSters.push(l.id);
    const u = await admin().from("lead_uri").update({ stare: "pierdut", motiv_categorie: "prea_scump" }).eq("id", l.id);
    expect(u.error).toBeNull();
    const { data } = await admin().from("evenimente").select("detalii").eq("lead_id", l.id).eq("tip", "stare").single();
    expect((data?.detalii as { categorie: string }).categorie).toBe("prea_scump");
  });

  it("ieșit din Pierdut, lead-ul pierde motivul, iar Parcursul nu-l mai duce", async () => {
    const l = await leadDeTest({ stare: "pierdut", motiv_categorie: "altceva", motiv: "Text vechi" });
    deSters.push(l.id);
    expect((await admin().from("lead_uri").update({ stare: "a_raspuns" }).eq("id", l.id)).error).toBeNull();
    const { data: lead } = await admin().from("lead_uri").select("motiv, motiv_categorie").eq("id", l.id).single();
    expect(lead).toEqual({ motiv: null, motiv_categorie: null });
    const { data } = await admin().from("evenimente").select("detalii").eq("lead_id", l.id).eq("tip", "stare").single();
    expect(data?.detalii).toEqual({ de: "pierdut", in: "a_raspuns" });
  });

  it("categoria necunoscută e refuzată", async () => {
    const l = await leadDeTest({ stare: "programat" });
    deSters.push(l.id);
    const u = await admin().from("lead_uri").update({ stare: "pierdut", motiv_categorie: "altul" }).eq("id", l.id);
    expect(u.error?.code).toBe("23514");
  });
});
