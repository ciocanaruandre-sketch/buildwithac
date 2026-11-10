// Problemele găsite la verificarea finală a ramurii: fiecare test le reproduce.
import { afterAll, describe, expect, it } from "vitest";
import { primesteCerere } from "@/lib/intrare";
import { admin, conecteazaCa, idDe, leadDeTest, sterge } from "./ajutor";

const lead_uri: string[] = [];
const oameni: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await sterge(id);
  for (const id of oameni) await admin().auth.admin.deleteUser(id);
});

const ziInUrma = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
let n = 0;
/** O oră viitoare unică pe rulare, ca discuțiile să nu se lovească de cele din alte teste. */
const oraViitoare = () => new Date(Date.UTC(2031, 0, 1) + (Date.now() % 100_000) * 3_600_000 + n++ * 7_200_000);

async function discutie(lead_id: string, closer_id: string, incepe: Date) {
  const { data, error } = await admin()
    .from("discutii")
    .insert({ lead_id, closer_id, incepe_la: incepe.toISOString(), sfarseste_la: new Date(incepe.getTime() + 30 * 60_000).toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function closerTemporar(activ = true) {
  const email = `temp${Date.now()}${oameni.length}@test.buildwithac.ro`;
  const { data, error } = await admin().auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  oameni.push(data.user.id);
  const p = await admin().from("profiluri").insert({ id: data.user.id, nume: "Temp closer", email, rol: "closer", activ });
  if (p.error) throw p.error;
  return data.user.id;
}

describe("lead adăugat direct prin API (fără pagină)", () => {
  it("callerul nu poate pune lead-ul pe alt om", async () => {
    const caller = await conecteazaCa("caller");
    const tel = `4078${Date.now().toString().slice(-7)}`;
    const { error } = await caller
      .from("lead_uri")
      .insert({ nume: "API", telefon: tel, telefon_norm: tel, serviciu: "site", sursa: "recomandare", creat_de: await idDe("caller"), caller_id: await idDe("caller2") });
    expect(error).not.toBeNull();
  });

  it("stările, closerul, încercările și data intrării nu se aleg la adăugare", async () => {
    const caller = await conecteazaCa("caller");
    const eu = await idDe("caller");
    const tel = `4077${Date.now().toString().slice(-7)}`;
    const { data, error } = await caller
      .from("lead_uri")
      .insert({
        nume: "API",
        telefon: tel,
        telefon_norm: tel,
        serviciu: "site",
        sursa: "recomandare",
        creat_de: eu,
        caller_id: eu,
        stare: "client",
        closer_id: eu,
        intrat_la: "2099-01-01T00:00:00Z",
        incercari: 5,
        motiv: "x",
        callback_la: "2099-01-01T00:00:00Z",
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    lead_uri.push(data!.id);
    const { data: l } = await admin().from("lead_uri").select("stare, closer_id, intrat_la, incercari, motiv, callback_la").eq("id", data!.id).single();
    expect(l).toMatchObject({ stare: "nou", closer_id: null, incercari: 0, motiv: null, callback_la: null });
    expect(Math.abs(new Date(l!.intrat_la).getTime() - Date.now())).toBeLessThan(3_600_000); // ceasul bazei, nu 2099
    const { data: c } = await admin().from("clienti").select("id").eq("lead_id", data!.id);
    expect(c).toHaveLength(0);
  });
});

describe("discuția programată ține pasul cu lead-ul", () => {
  it("Adminul schimbă closerul: discuția viitoare trece la cel nou", async () => {
    const vechi = await closerTemporar();
    const nou = await closerTemporar();
    const l = await leadDeTest({ caller_id: await idDe("caller"), closer_id: vechi, stare: "programat" });
    lead_uri.push(l.id);
    const d = await discutie(l.id, vechi, oraViitoare());

    const db = await conecteazaCa("admin");
    const { error } = await db.from("lead_uri").update({ closer_id: nou }).eq("id", l.id);
    expect(error).toBeNull();
    const { data } = await admin().from("discutii").select("closer_id").eq("id", d).single();
    expect(data?.closer_id).toBe(nou);
  });

  it("closerul nou e ocupat la ora aceea → schimbarea e refuzată", async () => {
    const vechi = await closerTemporar();
    const nou = await closerTemporar();
    const ora = oraViitoare();
    const l = await leadDeTest({ caller_id: await idDe("caller"), closer_id: vechi, stare: "programat" });
    const alt = await leadDeTest({ caller_id: await idDe("caller"), closer_id: nou, stare: "programat" });
    lead_uri.push(l.id, alt.id);
    await discutie(l.id, vechi, ora);
    await discutie(alt.id, nou, ora);

    const db = await conecteazaCa("admin");
    const { error } = await db.from("lead_uri").update({ closer_id: nou }).eq("id", l.id);
    expect(error?.code).toBe("23P01");
    const { data } = await admin().from("lead_uri").select("closer_id").eq("id", l.id).single();
    expect(data?.closer_id).toBe(vechi);
  });

  it("lead-ul iese din „programat”: discuția viitoare dispare și ora se eliberează", async () => {
    const closer = await closerTemporar();
    const l = await leadDeTest({ caller_id: await idDe("caller"), closer_id: closer, stare: "programat" });
    lead_uri.push(l.id);
    const d = await discutie(l.id, closer, oraViitoare());

    const caller = await conecteazaCa("caller");
    const { error } = await caller.from("lead_uri").update({ stare: "callback", callback_la: oraViitoare().toISOString() }).eq("id", l.id);
    expect(error).toBeNull();
    const { data } = await admin().from("discutii").select("id").eq("id", d);
    expect(data).toHaveLength(0);
  });

  it("„Mută tot la…” merge mai departe când o discuție nu poate trece (ora e ocupată la cel nou)", async () => {
    const plecat = await closerTemporar(false);
    const nou = await closerTemporar();
    const ora = oraViitoare();
    const l = await leadDeTest({ caller_id: await idDe("caller"), closer_id: plecat, stare: "programat" });
    const alt = await leadDeTest({ caller_id: await idDe("caller"), closer_id: nou, stare: "programat" });
    lead_uri.push(l.id, alt.id);
    await discutie(l.id, plecat, ora);
    await discutie(alt.id, nou, ora);

    const db = await conecteazaCa("admin");
    const { data, error } = await db.rpc("muta_lead_uri", { de: plecat, la: nou });
    expect(error).toBeNull();
    expect(data).toEqual({ lead_uri: 1, discutii: 0, discutii_ramase: 1 });
  });
});

describe("cele 90 de zile", () => {
  it("o cerere nouă pe un lead deschis repornește numărătoarea", async () => {
    const l = await leadDeTest({ stare: "callback", intrat_la: ziInUrma(80) });
    lead_uri.push(l.id);
    const r = await primesteCerere(
      { nume: "Test", telefon: `+${l.telefon_norm}`, email: null, serviciu: "site", sursa: "formular_site", raspunsuri: [], utm: {}, idExtern: null },
      admin(),
    );
    expect(r).toEqual({ id: l.id, decizie: "leaga_de_lead" });
    const { data } = await admin().from("lead_uri").select("intrat_la").eq("id", l.id).single();
    expect(Math.abs(new Date(data!.intrat_la).getTime() - Date.now())).toBeLessThan(60_000);
  });
});
