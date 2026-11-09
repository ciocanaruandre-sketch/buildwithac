import { afterAll, describe, expect, it } from "vitest";
import { admin, conecteazaCa, idDe, leadDeTest, sterge } from "./ajutor";

const deSters: string[] = [];
const nou = async (...a: Parameters<typeof leadDeTest>) => {
  const l = await leadDeTest(...a);
  deSters.push(l.id);
  return l;
};
afterAll(async () => {
  for (const id of deSters) await sterge(id);
});

describe("lead-urile și permisiunile", () => {
  it("callerul vede toate lead-urile, și pe ale altui caller", async () => {
    const l = await nou({ caller_id: await idDe("caller2") });
    const db = await conecteazaCa("caller");
    const { data } = await db.from("lead_uri").select("id").eq("id", l.id);
    expect(data).toHaveLength(1);
  });

  it("constructorul nu vede niciun lead", async () => {
    await nou();
    const db = await conecteazaCa("constructor");
    const { data } = await db.from("lead_uri").select("id");
    expect(data).toEqual([]);
  });

  it("callerul își ia un lead liber, iar Parcursul notează", async () => {
    const l = await nou();
    const eu = await idDe("caller");
    const db = await conecteazaCa("caller");
    const { data } = await db.from("lead_uri").update({ caller_id: eu }).eq("id", l.id).is("caller_id", null).select();
    expect(data).toHaveLength(1);
    const { data: ev } = await admin().from("evenimente").select("tip, detalii").eq("lead_id", l.id).eq("tip", "caller");
    expect(ev).toEqual([{ tip: "caller", detalii: { de: null, in: eu } }]);
  });

  it("al doilea caller nu poate lua un lead deja luat", async () => {
    const primul = await idDe("caller");
    const l = await nou({ caller_id: primul });
    const db = await conecteazaCa("caller2");
    const { data } = await db.from("lead_uri").update({ caller_id: await idDe("caller2") }).eq("id", l.id).is("caller_id", null).select();
    expect(data).toEqual([]);
    const { data: dupa } = await admin().from("lead_uri").select("caller_id").eq("id", l.id).single();
    expect(dupa?.caller_id).toBe(primul);
  });

  it("callerul nu poate muta lead-ul lui la altcineva", async () => {
    const l = await nou({ caller_id: await idDe("caller") });
    const db = await conecteazaCa("caller");
    const { error } = await db.from("lead_uri").update({ caller_id: await idDe("caller2") }).eq("id", l.id);
    expect(error).not.toBeNull();
  });

  it("callerul nu poate pune „client”, closerul poate, iar clientul apare", async () => {
    const closer = await idDe("closer");
    const l = await nou({ caller_id: await idDe("caller"), closer_id: closer, stare: "programat" });
    const caller = await conecteazaCa("caller");
    const { error } = await caller.from("lead_uri").update({ stare: "client" }).eq("id", l.id);
    expect(error).not.toBeNull();

    const db = await conecteazaCa("closer");
    const { error: e2 } = await db.from("lead_uri").update({ stare: "client" }).eq("id", l.id);
    expect(e2).toBeNull();
    const { data: c } = await admin().from("clienti").select("lead_id").eq("lead_id", l.id);
    expect(c).toHaveLength(1);
  });

  it("callerul nu poate șterge; adminul poate", async () => {
    const l = await nou({ caller_id: await idDe("caller") });
    const caller = await conecteazaCa("caller");
    const { data } = await caller.from("lead_uri").delete().eq("id", l.id).select();
    expect(data).toEqual([]);
    const db = await conecteazaCa("admin");
    const { data: d2 } = await db.from("lead_uri").delete().eq("id", l.id).select();
    expect(d2).toHaveLength(1);
  });

  it("un cont dezactivat nu vede nimic", async () => {
    await nou();
    const id = await idDe("caller2");
    await admin().from("profiluri").update({ activ: false }).eq("id", id);
    try {
      const db = await conecteazaCa("caller2");
      const { data } = await db.from("lead_uri").select("id");
      expect(data).toEqual([]);
    } finally {
      await admin().from("profiluri").update({ activ: true }).eq("id", id);
    }
  });

  it("nimeni nu scrie direct în Parcurs, nici adminul", async () => {
    const l = await nou();
    const db = await conecteazaCa("admin");
    const { error } = await db.from("evenimente").insert({ lead_id: l.id, tip: "fals" });
    expect(error).not.toBeNull();
  });
});
