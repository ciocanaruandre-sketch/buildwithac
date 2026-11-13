import { afterAll, describe, expect, it } from "vitest";
import { admin, clientDeTest, conecteazaCa, idDe, omTemporar, stergeClient, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await stergeClient(id);
  await stergeTemporari();
});

/** Un proiect nou; `cu` = conturile puse pe el. */
async function proiect(...cu: string[]) {
  const c = await clientDeTest();
  lead_uri.push(c.lead.id);
  for (const om of cu) {
    const { error } = await admin().from("proiect_oameni").insert({ proiect_id: c.proiectId, om_id: om });
    if (error) throw error;
  }
  return c.proiectId;
}

async function task(proiectId: string, camp: { titlu?: string; om_id?: string | null; gata?: boolean } = {}) {
  const { data, error } = await admin().from("taskuri").insert({ proiect_id: proiectId, titlu: "Task de test", ...camp }).select().single();
  if (error) throw error;
  return data;
}

describe("taskuri", () => {
  it("constructorul din afara proiectului nu vede și nu adaugă task-uri", async () => {
    const p = await proiect();
    const t = await task(p);
    const c = await conecteazaCa("constructor");
    expect((await c.from("taskuri").select("id").eq("proiect_id", p)).data).toEqual([]);
    const ins = await c.from("taskuri").insert({ proiect_id: p, titlu: "Nu e al meu" });
    expect(ins.error).not.toBeNull();
    const upd = await c.from("taskuri").update({ gata: true }).eq("id", t.id).select("id");
    expect(upd.data ?? []).toHaveLength(0);
    const del = await c.from("taskuri").delete().eq("id", t.id).select("id");
    expect(del.data ?? []).toHaveLength(0);
  });

  it("constructorul de pe proiect adaugă un task și îl bifează: gata_la se pune singur, la debifare se golește", async () => {
    const eu = await idDe("constructor");
    const p = await proiect(eu);
    const c = await conecteazaCa("constructor");
    const ins = await c.from("taskuri").insert({ proiect_id: p, titlu: "Pagina de meniu", om_id: eu, termen: "2026-11-13" }).select().single();
    expect(ins.error).toBeNull();
    expect(ins.data).toMatchObject({ gata: false, gata_la: null, creat_de: eu, om_id: eu, termen: "2026-11-13" });

    const gata = await c.from("taskuri").update({ gata: true }).eq("id", ins.data!.id).select("gata, gata_la").single();
    expect(gata.data?.gata).toBe(true);
    expect(Math.abs(new Date(gata.data!.gata_la!).getTime() - Date.now())).toBeLessThan(600_000); // ceasul bazei și al calculatorului nu bat la secundă

    const inapoi = await c.from("taskuri").update({ gata: false }).eq("id", ins.data!.id).select("gata, gata_la").single();
    expect(inapoi.data).toEqual({ gata: false, gata_la: null });
  });

  it("task-ul nu se poate da unui om din afara proiectului, dar se poate da Adminului", async () => {
    const eu = await idDe("constructor");
    const p = await proiect(eu);
    const c = await conecteazaCa("constructor");
    const rau = await c.from("taskuri").insert({ proiect_id: p, titlu: "Pentru caller", om_id: await idDe("caller") });
    expect(rau.error?.message).toBe("Task-ul se dă doar cuiva din proiect.");
    const altConstructor = await c.from("taskuri").insert({ proiect_id: p, titlu: "Pentru altul", om_id: await omTemporar("constructor") });
    expect(altConstructor.error?.message).toBe("Task-ul se dă doar cuiva din proiect.");
    const bun = await c.from("taskuri").insert({ proiect_id: p, titlu: "Pentru Andrei", om_id: await idDe("admin") });
    expect(bun.error).toBeNull();
  });

  it("task-ul nu se mută pe alt proiect", async () => {
    const eu = await idDe("constructor");
    const p1 = await proiect(eu);
    const p2 = await proiect(eu);
    const t = await task(p1);
    const c = await conecteazaCa("constructor");
    const { error } = await c.from("taskuri").update({ proiect_id: p2 }).eq("id", t.id);
    expect(error?.message).toBe("Task-ul nu se mută pe alt proiect.");
  });

  it("scos de pe proiect: task-urile lui negata rămân fără om, cele gata îl păstrează", async () => {
    const om = await omTemporar("constructor");
    const p = await proiect(om);
    const deFacut = await task(p, { om_id: om });
    const facut = await task(p, { om_id: om, gata: true });
    const a = await conecteazaCa("admin");
    const { error } = await a.from("proiect_oameni").delete().eq("proiect_id", p).eq("om_id", om);
    expect(error).toBeNull();

    const { data } = await admin().from("taskuri").select("id, om_id").in("id", [deFacut.id, facut.id]);
    expect(data?.find((t) => t.id === deFacut.id)?.om_id).toBeNull();
    expect(data?.find((t) => t.id === facut.id)?.om_id).toBe(om);
    const { data: ev } = await admin().from("evenimente_proiect").select("tip").eq("proiect_id", p).eq("tip", "om_scos");
    expect(ev).toHaveLength(1);
  });

  it("muta_taskuri: constructorul nu are voie", async () => {
    const c = await conecteazaCa("constructor");
    const { error } = await c.rpc("muta_taskuri", { de: await idDe("constructor"), la: await idDe("admin") });
    expect(error?.message).toContain("Doar Adminul");
  });

  it("muta_taskuri: Adminul mută task-urile negata și îl pune pe omul nou pe proiect; cele gata rămân", async () => {
    const plecat = await omTemporar("constructor");
    const nou = await omTemporar("constructor");
    const p = await proiect(plecat);
    const t1 = await task(p, { om_id: plecat });
    const t2 = await task(p, { om_id: plecat });
    const gata = await task(p, { om_id: plecat, gata: true });
    await admin().from("profiluri").update({ activ: false }).eq("id", plecat);

    const a = await conecteazaCa("admin");
    const { data, error } = await a.rpc("muta_taskuri", { de: plecat, la: nou });
    expect(error).toBeNull();
    expect(data).toBe(2);

    const { data: dupa } = await admin().from("taskuri").select("id, om_id").in("id", [t1.id, t2.id, gata.id]);
    expect(dupa?.filter((t) => t.om_id === nou).map((t) => t.id).sort()).toEqual([t1.id, t2.id].sort());
    expect(dupa?.find((t) => t.id === gata.id)?.om_id).toBe(plecat);
    // Omul nou primește procentul de bază al constructorului pentru serviciul proiectului (null dacă nu e stabilit).
    const { data: pr } = await admin().from("proiecte").select("serviciu").eq("id", p).single();
    const { data: baza } = await admin().from("procente_baza").select("procent")
      .eq("categorie", pr!.serviciu).eq("rol", "constructor").maybeSingle();
    const { data: rand } = await admin().from("proiect_oameni").select("procent").eq("proiect_id", p).eq("om_id", nou);
    expect(rand).toEqual([{ procent: baza?.procent ?? null }]);
  });

  it("muta_taskuri: nu la un caller și nu la un cont oprit", async () => {
    const plecat = await omTemporar("constructor");
    const a = await conecteazaCa("admin");
    const mesaj = "Task-urile trec doar la un constructor cu contul pornit sau la Admin.";
    expect((await a.rpc("muta_taskuri", { de: plecat, la: await idDe("caller") })).error?.message).toBe(mesaj);
    expect((await a.rpc("muta_taskuri", { de: plecat, la: await omTemporar("constructor", false) })).error?.message).toBe(mesaj);
  });
});
