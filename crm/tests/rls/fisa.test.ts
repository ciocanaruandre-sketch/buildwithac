import { afterAll, describe, expect, it } from "vitest";
import { admin, clientDeTest, conecteazaCa, idDe, stergeClient, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await stergeClient(id);
  await stergeTemporari();
});

/** Un proiect nou; `cuConstructorul` = contul de test „constructor” e pus pe el. */
async function proiect(cuConstructorul: boolean) {
  const c = await clientDeTest();
  lead_uri.push(c.lead.id);
  if (cuConstructorul) {
    const { error } = await admin().from("proiect_oameni").insert({ proiect_id: c.proiectId, om_id: await idDe("constructor") });
    if (error) throw error;
  }
  return c.proiectId;
}

describe("notițele proiectului", () => {
  it("constructorul din afara proiectului nu le vede și nu scrie", async () => {
    const p = await proiect(false);
    await admin().from("notite_proiect").insert({ proiect_id: p, text: "Doar pentru cei de pe proiect", autor_id: await idDe("admin") });
    const c = await conecteazaCa("constructor");
    expect((await c.from("notite_proiect").select("id").eq("proiect_id", p)).data).toEqual([]);
    const ins = await c.from("notite_proiect").insert({ proiect_id: p, text: "Nu e al meu" });
    expect(ins.error).not.toBeNull();
  });

  it("constructorul de pe proiect scrie o notiță, dar n-o șterge, n-o schimbă și nu scrie în numele altcuiva", async () => {
    const p = await proiect(true);
    const eu = await idDe("constructor");
    const c = await conecteazaCa("constructor");
    const ins = await c.from("notite_proiect").insert({ proiect_id: p, text: "Vrea meniul pe categorii." }).select("id, autor_id").single();
    expect(ins.error).toBeNull();
    expect(ins.data?.autor_id).toBe(eu);

    const del = await c.from("notite_proiect").delete().eq("id", ins.data!.id).select("id");
    expect(del.data ?? []).toHaveLength(0);
    const upd = await c.from("notite_proiect").update({ text: "Alt text" }).eq("id", ins.data!.id).select("id");
    expect(upd.data ?? []).toHaveLength(0);
    const fals = await c.from("notite_proiect").insert({ proiect_id: p, text: "Semnat de altul", autor_id: await idDe("admin") });
    expect(fals.error).not.toBeNull();

    const a = await conecteazaCa("admin");
    const sters = await a.from("notite_proiect").delete().eq("id", ins.data!.id).select("id");
    expect(sters.data).toHaveLength(1);
  });

  it("callerul nu vede notițele proiectului, nici la clientul lui", async () => {
    const c0 = await clientDeTest({ caller_id: await idDe("caller") });
    lead_uri.push(c0.lead.id);
    await admin().from("notite_proiect").insert({ proiect_id: c0.proiectId, text: "Despre bani", autor_id: await idDe("admin") });
    const c = await conecteazaCa("caller");
    expect((await c.from("notite_proiect").select("id").eq("proiect_id", c0.proiectId)).data).toEqual([]);
    expect((await c.from("livrari").select("id").eq("proiect_id", c0.proiectId)).data).toEqual([]);
  });
});

describe("livrările", () => {
  it("constructorul din afara proiectului nu le vede și nu adaugă", async () => {
    const p = await proiect(false);
    await admin().from("livrari").insert({ proiect_id: p, titlu: "Schița" });
    const c = await conecteazaCa("constructor");
    expect((await c.from("livrari").select("id").eq("proiect_id", p)).data).toEqual([]);
    const ins = await c.from("livrari").insert({ proiect_id: p, titlu: "Nu e al meu" });
    expect(ins.error).not.toBeNull();
  });

  it("livrarea nouă și schimbarea stării apar în parcurs", async () => {
    const p = await proiect(true);
    const c = await conecteazaCa("constructor");
    const ins = await c.from("livrari").insert({ proiect_id: p, titlu: "Schița (v2)", link: "https://exemplu.ro/schita" }).select("id, stare").single();
    expect(ins.error).toBeNull();
    expect(ins.data?.stare).toBe("trimis");
    const upd = await c.from("livrari").update({ stare: "aprobat" }).eq("id", ins.data!.id);
    expect(upd.error).toBeNull();

    const { data } = await admin().from("evenimente_proiect").select("tip, detalii, autor_id").eq("proiect_id", p).in("tip", ["livrat", "livrare_stare"]).order("id");
    expect(data).toEqual([
      { tip: "livrat", detalii: { titlu: "Schița (v2)" }, autor_id: await idDe("constructor") },
      { tip: "livrare_stare", detalii: { titlu: "Schița (v2)", in: "aprobat" }, autor_id: await idDe("constructor") },
    ]);
  });

  it("linkul trebuie să fie http(s)", async () => {
    const p = await proiect(true);
    const c = await conecteazaCa("constructor");
    const { error } = await c.from("livrari").insert({ proiect_id: p, titlu: "Cu link rău", link: "javascript:alert(1)" });
    expect(error?.code).toBe("23514");
  });
});
