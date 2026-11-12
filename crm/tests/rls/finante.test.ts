import { afterAll, describe, expect, it } from "vitest";
import { ziuaRomaniei } from "@/lib/timp";
import { admin, clientDeTest, conecteazaCa, idDe, stergeClient, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
afterAll(async () => {
  for (const id of lead_uri) await stergeClient(id);
  await admin().from("procente_baza").update({ procent: null }).neq("categorie", "");
  await stergeTemporari();
});

const azi = () => ziuaRomaniei(new Date());

async function client(camp: Parameters<typeof clientDeTest>[0] = {}) {
  const c = await clientDeTest(camp);
  lead_uri.push(c.lead.id);
  return c;
}

/** O tranșă neîncasată, cu cheia de serviciu. */
async function transa(proiectId: string, suma = 2000, scadenta = azi(), eticheta = "Avans") {
  const { data, error } = await admin().from("transe").insert({ proiect_id: proiectId, tip: "avans", eticheta, suma_lei: suma, scadenta }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function puneConstructor(proiectId: string, procent: number | null) {
  const { error } = await admin().from("proiect_oameni").upsert({ proiect_id: proiectId, om_id: await idDe("constructor"), procent });
  if (error) throw error;
}

describe("finanțe: tabelele și permisiunile", () => {
  it("callerul și closerul clientului intră pe proiectul nou, cu procentul de bază", async () => {
    await admin().from("procente_baza").update({ procent: 10 }).eq("categorie", "site").eq("rol", "caller");
    const { proiectId } = await client({ serviciu: "site", caller_id: await idDe("caller"), closer_id: await idDe("closer") });
    const { data } = await admin().from("proiect_vanzari").select("om_id, procent").eq("proiect_id", proiectId).order("procent");
    expect(data).toEqual(
      expect.arrayContaining([
        { om_id: await idDe("caller"), procent: 10 },
        { om_id: await idDe("closer"), procent: null },
      ]),
    );
    expect(data).toHaveLength(2);
    await admin().from("procente_baza").update({ procent: null }).eq("categorie", "site").eq("rol", "caller");
  });

  it("un caller cu procent pe proiect nu vede proiectul; își vede doar rândul lui", async () => {
    const { proiectId } = await client({ caller_id: await idDe("caller"), closer_id: await idDe("closer") });
    const c = await conecteazaCa("caller");
    expect((await c.from("proiecte").select("id").eq("id", proiectId)).data).toEqual([]);
    expect((await c.from("proiect_vanzari").select("om_id").eq("proiect_id", proiectId)).data).toEqual([{ om_id: await idDe("caller") }]);
  });

  it("pe lista de vânzări se pun doar calleri și closeri", async () => {
    const { proiectId } = await client();
    const { error } = await admin().from("proiect_vanzari").insert({ proiect_id: proiectId, om_id: await idDe("constructor") });
    expect(error?.message).toBe("Aici se pun doar calleri și closeri cu contul pornit.");
  });

  it("doar Adminul citește și scrie tranșele și procentele de bază", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    await transa(proiectId);
    for (const cont of ["caller", "closer", "constructor"] as const) {
      const c = await conecteazaCa(cont);
      expect((await c.from("transe").select("id").eq("proiect_id", proiectId)).data).toEqual([]);
      expect((await c.from("procente_baza").select("rol")).data).toEqual([]);
      const ins = await c.from("transe").insert({ proiect_id: proiectId, tip: "extra", eticheta: "X", suma_lei: 1, scadenta: azi() }).select("id");
      expect(ins.error ?? ins.data?.length === 0).toBeTruthy();
    }
    const a = await conecteazaCa("admin");
    expect((await a.from("transe").select("id").eq("proiect_id", proiectId)).data).toHaveLength(1);
    expect((await a.from("procente_baza").select("rol")).data).toHaveLength(15);
    const ins = await a.from("transe").insert({ proiect_id: proiectId, tip: "extra", eticheta: "Tranșă", suma_lei: 100, scadenta: azi() }).select("id");
    expect(ins.error).toBeNull();
  });

  it("omul își vede doar comisioanele lui", async () => {
    const { proiectId } = await client();
    const t = await transa(proiectId);
    const r = await admin()
      .from("comisioane")
      .insert([
        { tip: "comision", transa_id: t, proiect_id: proiectId, om_id: await idDe("constructor"), procent: 30, baza_lei: 2000, suma_lei: 600 },
        { tip: "comision", transa_id: t, proiect_id: proiectId, om_id: await idDe("caller"), procent: 10, baza_lei: 2000, suma_lei: 200 },
      ]);
    expect(r.error).toBeNull();
    const k = await conecteazaCa("constructor");
    expect((await k.from("comisioane").select("suma_lei").eq("proiect_id", proiectId)).data).toEqual([{ suma_lei: 600 }]);
    const c = await conecteazaCa("caller");
    expect((await c.from("comisioane").select("suma_lei").eq("proiect_id", proiectId)).data).toEqual([{ suma_lei: 200 }]);
  });

  it("nimeni nu adaugă sau nu șterge comisioane direct, nici Adminul", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const ins = await a.from("comisioane").insert({ tip: "comision", proiect_id: proiectId, om_id: await idDe("constructor"), procent: 30, baza_lei: 100, suma_lei: 30 });
    expect(ins.error).not.toBeNull();
  });

  it("Adminul nu poate bifa direct o tranșă ca încasată", async () => {
    const { proiectId } = await client();
    const t = await transa(proiectId);
    const a = await conecteazaCa("admin");
    const { error } = await a.from("transe").update({ incasata_la: azi(), incasat_lei: 100 }).eq("id", t);
    expect(error?.message).toBe("Încasarea se face doar din butonul „Am încasat”.");
  });
});
