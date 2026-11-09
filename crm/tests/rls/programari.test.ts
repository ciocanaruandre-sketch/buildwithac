import { afterAll, describe, expect, it } from "vitest";
import { admin, conecteazaCa, idDe, leadDeTest, sterge } from "./ajutor";

const deSters: string[] = [];
afterAll(async () => {
  for (const id of deSters) await sterge(id);
});

// o oră fixă, departe în viitor, ca să nu se lovească de seed sau de alte rulări
const peste = (zile: number, ora: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + zile);
  d.setUTCHours(ora, 0, 0, 0);
  return d.toISOString();
};

describe("programările", () => {
  it("doi calleri pe aceeași oră a aceluiași closer: al doilea e respins", async () => {
    const closer = await idDe("closer");
    const a = await leadDeTest({ caller_id: await idDe("caller"), stare: "a_raspuns" });
    const b = await leadDeTest({ caller_id: await idDe("caller2"), stare: "a_raspuns" });
    deSters.push(a.id, b.id);
    const ora = peste(40 + (Date.now() % 100), 7);

    const unu = await (await conecteazaCa("caller")).rpc("programeaza_discutie", { p_lead: a.id, p_closer: closer, p_incepe: ora });
    expect(unu.error).toBeNull();
    const doi = await (await conecteazaCa("caller2")).rpc("programeaza_discutie", { p_lead: b.id, p_closer: closer, p_incepe: ora });
    expect(doi.error?.code).toBe("23P01");

    const { data: lb } = await admin().from("lead_uri").select("stare, closer_id").eq("id", b.id).single();
    expect(lb).toEqual({ stare: "a_raspuns", closer_id: null });
    const { data: la } = await admin().from("lead_uri").select("stare, closer_id").eq("id", a.id).single();
    expect(la).toEqual({ stare: "programat", closer_id: closer });
  });

  it("callerul nu poate programa înainte să răspundă omul", async () => {
    const l = await leadDeTest({ caller_id: await idDe("caller") });
    deSters.push(l.id);
    const r = await (await conecteazaCa("caller")).rpc("programeaza_discutie", { p_lead: l.id, p_closer: await idDe("closer"), p_incepe: peste(60, 8) });
    expect(r.error).not.toBeNull();
  });

  it("callerul nu poate programa pe lead-ul altuia", async () => {
    const l = await leadDeTest({ caller_id: await idDe("caller2"), stare: "a_raspuns" });
    deSters.push(l.id);
    const r = await (await conecteazaCa("caller")).rpc("programeaza_discutie", { p_lead: l.id, p_closer: await idDe("closer"), p_incepe: peste(61, 8) });
    expect(r.error).not.toBeNull();
  });

  it("callerul nu poate scrie în programul closerului", async () => {
    const db = await conecteazaCa("caller");
    const r = await db.rpc("salveaza_program", { p_closer: await idDe("closer"), p_zile: [{ zi: 1, de_la: "06:00", pana_la: "07:00" }], p_durata: 30 });
    expect(r.error).not.toBeNull();
    const direct = await db.from("program_closer").insert({ closer_id: await idDe("closer"), zi: 1, de_la: "06:00", pana_la: "07:00" });
    expect(direct.error).not.toBeNull();
  });

  it("closerul își scrie singur programul", async () => {
    const closer = await idDe("closer");
    const db = await conecteazaCa("closer");
    const zile = [1, 2, 3, 4, 5].map((zi) => ({ zi, de_la: "10:00", pana_la: "18:00" }));
    const r = await db.rpc("salveaza_program", { p_closer: closer, p_zile: zile, p_durata: 30 });
    expect(r.error).toBeNull();
    const { data } = await admin().from("program_closer").select("zi").eq("closer_id", closer);
    expect(data).toHaveLength(5);
  });
});
