import { afterAll, describe, expect, it } from "vitest";
import { admin, conecteazaCa, idDe, leadDeTest, omTemporar, stergeTemporari, sterge } from "./ajutor";

// conturi temporare: nu atingem lead-urile conturilor din seed
const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await sterge(id);
  await stergeTemporari();
});

describe("echipa", () => {
  it("callerul nu poate schimba profilurile (0 rânduri)", async () => {
    const caller = await conecteazaCa("caller");
    const { data } = await caller.from("profiluri").update({ rol: "admin" }).eq("id", await idDe("caller2")).select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("muta_lead_uri apelată de caller → eroare", async () => {
    const caller = await conecteazaCa("caller");
    const { error } = await caller.rpc("muta_lead_uri", { de: await idDe("caller2"), la: await idDe("caller") });
    expect(error?.message).toContain("Doar Adminul");
  });

  it("adminul mută lead-urile deschise ale unui om; cele închise rămân; Parcursul are mutarea", async () => {
    const plecat = await omTemporar("caller", false);
    const caller = await idDe("caller");
    const deschise = [await leadDeTest({ caller_id: plecat, stare: "nou" }), await leadDeTest({ caller_id: plecat, stare: "callback" })];
    const inchis = await leadDeTest({ caller_id: plecat, stare: "pierdut", motiv: "Prea scump" });
    lead_uri.push(...deschise.map((l) => l.id), inchis.id);

    const db = await conecteazaCa("admin");
    const { data, error } = await db.rpc("muta_lead_uri", { de: plecat, la: caller });
    expect(error).toBeNull();
    expect(data).toEqual({ lead_uri: 2, discutii: 0, discutii_ramase: 0 });

    const { data: dupa } = await admin().from("lead_uri").select("id, caller_id").in("id", lead_uri);
    const caller_ul = Object.fromEntries((dupa ?? []).map((l) => [l.id, l.caller_id]));
    expect(caller_ul[deschise[0].id]).toBe(caller);
    expect(caller_ul[deschise[1].id]).toBe(caller);
    expect(caller_ul[inchis.id]).toBe(plecat);

    const { data: ev } = await admin().from("evenimente").select("lead_id, detalii").eq("tip", "caller").in("lead_id", deschise.map((l) => l.id));
    expect(ev).toHaveLength(2);
    expect(ev?.[0].detalii).toEqual({ de: plecat, in: caller });
  });

  it("nu mută la un om oprit sau cu alt rol", async () => {
    const plecat = await omTemporar("caller", false);
    const altOprit = await omTemporar("caller", false);
    const db = await conecteazaCa("admin");
    const oprit = await db.rpc("muta_lead_uri", { de: plecat, la: altOprit });
    expect(oprit.error?.message).toContain("contul oprit");
    const altRol = await db.rpc("muta_lead_uri", { de: plecat, la: await idDe("closer") });
    expect(altRol.error?.message).toContain("același rol");
  });

  it("discuțiile viitoare ale closerului plecat trec la cel nou", async () => {
    const plecat = await omTemporar("closer", false);
    const nou = await omTemporar("closer");
    const l = await leadDeTest({ caller_id: await idDe("caller"), closer_id: plecat, stare: "programat" });
    lead_uri.push(l.id);
    const incepe = new Date(Date.now() + 3 * 86_400_000);
    const d = await admin()
      .from("discutii")
      .insert({ lead_id: l.id, closer_id: plecat, incepe_la: incepe.toISOString(), sfarseste_la: new Date(incepe.getTime() + 30 * 60_000).toISOString() })
      .select("id")
      .single();
    expect(d.error).toBeNull();

    const db = await conecteazaCa("admin");
    const { data } = await db.rpc("muta_lead_uri", { de: plecat, la: nou });
    expect(data).toEqual({ lead_uri: 1, discutii: 1, discutii_ramase: 0 });
    const { data: dupa } = await admin().from("discutii").select("closer_id").eq("id", d.data!.id).single();
    expect(dupa?.closer_id).toBe(nou);
  });
});
