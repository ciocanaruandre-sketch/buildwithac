import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ziuaPeste, ziuaRomaniei } from "@/lib/timp";
import { admin, clientDeTest, conecteazaCa, idDe, omTemporar, stergeClient, stergeTemporari } from "./ajutor";

const lead_uri: string[] = [];
// procentele de bază ale bazei de test (le pune `npm run demo`): testele le schimbă, la final se pun la loc
let procente: { categorie: string; rol: "caller" | "closer" | "constructor" | "admin"; procent: number | null }[] = [];
beforeAll(async () => {
  procente = (await admin().from("procente_baza").select("categorie, rol, procent")).data ?? [];
});
afterAll(async () => {
  for (const id of lead_uri) await stergeClient(id);
  for (const b of procente) await admin().from("procente_baza").update({ procent: b.procent }).eq("categorie", b.categorie).eq("rol", b.rol);
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
    // procentele de pe baza de test (le pune `npm run demo`) se pun la loc la final
    const { data: inainte } = await admin().from("procente_baza").select("rol, procent").eq("categorie", "site").in("rol", ["caller", "closer"]);
    await admin().from("procente_baza").update({ procent: 10 }).eq("categorie", "site").eq("rol", "caller");
    await admin().from("procente_baza").update({ procent: null }).eq("categorie", "site").eq("rol", "closer");
    const { proiectId } = await client({ serviciu: "site", caller_id: await idDe("caller"), closer_id: await idDe("closer") });
    const { data } = await admin().from("proiect_vanzari").select("om_id, procent").eq("proiect_id", proiectId).order("procent");
    expect(data).toEqual(
      expect.arrayContaining([
        { om_id: await idDe("caller"), procent: 10 },
        { om_id: await idDe("closer"), procent: null },
      ]),
    );
    expect(data).toHaveLength(2);
    for (const r of inainte ?? []) await admin().from("procente_baza").update({ procent: r.procent }).eq("categorie", "site").eq("rol", r.rol);
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

async function puneCaller(proiectId: string, procent: number | null) {
  const { error } = await admin().from("proiect_vanzari").upsert({ proiect_id: proiectId, om_id: await idDe("caller"), procent });
  if (error) throw error;
}

async function comisioaneDin(transaId: string) {
  const { data, error } = await admin().from("comisioane").select("om_id, procent, baza_lei, suma_lei, platit_la, tip").eq("transa_id", transaId).order("suma_lei");
  if (error) throw error;
  return data;
}

async function incaseaza(t: string, suma: number, peste = false) {
  return (await conecteazaCa("admin")).rpc("incaseaza", { t, suma, zi: azi(), peste });
}

describe("finanțe: încasarea și comisioanele", () => {
  it("încasarea face comisioanele: constructorul 30%, callerul 10%, Adminul nimic", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    await puneCaller(proiectId, 10);
    const t = await transa(proiectId, 2000);
    const r = await incaseaza(t, 2000);
    expect(r.error).toBeNull();
    expect(r.data).toBe(t);
    const k = await comisioaneDin(t);
    expect(k.map((x) => [x.om_id, x.suma_lei])).toEqual([
      [await idDe("caller"), 200],
      [await idDe("constructor"), 600],
    ]);
    expect(k.every((x) => x.baza_lei === 2000 && x.platit_la === null)).toBe(true);
  });

  it("plata parțială taie tranșa: 1.200 din 2.000", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 2000, "2026-01-10", "Rata 2 din 4");
    expect((await incaseaza(t, 1200)).error).toBeNull();
    const { data } = await admin().from("transe").select("id, eticheta, suma_lei, scadenta, incasat_lei").eq("proiect_id", proiectId).order("suma_lei");
    expect(data).toEqual([
      { id: expect.any(String), eticheta: "Rata 2 din 4 · rest", suma_lei: 800, scadenta: "2026-01-10", incasat_lei: null },
      { id: t, eticheta: "Rata 2 din 4", suma_lei: 1200, scadenta: "2026-01-10", incasat_lei: 1200 },
    ]);
    expect((await comisioaneDin(t)).map((x) => x.suma_lei)).toEqual([360]);
  });

  it("plata mai mare cere confirmare", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 2000);
    expect((await incaseaza(t, 2500)).error?.message).toBe("Suma e mai mare decât tranșa. Confirmă.");
    expect((await incaseaza(t, 2500, true)).error).toBeNull();
    expect((await comisioaneDin(t)).map((x) => x.suma_lei)).toEqual([750]);
  });

  it("procentul schimbat după încasare nu atinge comisioanele făcute", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    await puneConstructor(proiectId, 50);
    expect((await comisioaneDin(t)).map((x) => [x.procent, x.suma_lei])).toEqual([[30, 600]]);
  });

  it("procentul nestabilit se completează când Adminul îl pune; cel plătit nu se schimbă", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, null);
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    expect((await comisioaneDin(t)).map((x) => x.suma_lei)).toEqual([null]);
    const a = await conecteazaCa("admin");
    await a.from("proiect_oameni").update({ procent: 25 }).eq("proiect_id", proiectId).eq("om_id", await idDe("constructor"));
    expect((await comisioaneDin(t)).map((x) => [x.procent, x.suma_lei])).toEqual([[25, 500]]);

    // procentul pus pe 0: comisionul nestabilit dispare
    const t2 = await transa(proiectId, 1000);
    await a.from("proiect_oameni").update({ procent: null }).eq("proiect_id", proiectId).eq("om_id", await idDe("constructor"));
    await incaseaza(t2, 1000);
    await a.from("proiect_oameni").update({ procent: 0 }).eq("proiect_id", proiectId).eq("om_id", await idDe("constructor"));
    expect(await comisioaneDin(t2)).toEqual([]);
    expect((await comisioaneDin(t)).map((x) => x.suma_lei)).toEqual([500]);
  });

  it("procentul 0 nu face comision", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 0);
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    expect(await comisioaneDin(t)).toEqual([]);
  });

  it("o tranșă încasată nu se schimbă și nu se șterge direct", async () => {
    const { proiectId } = await client();
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    const a = await conecteazaCa("admin");
    expect((await a.from("transe").update({ suma_lei: 1 }).eq("id", t)).error?.message).toBe("Tranșa e încasată. Anulează încasarea întâi.");
    expect((await a.from("transe").delete().eq("id", t)).error?.message).toBe("Tranșa e încasată. Anulează încasarea întâi.");
  });

  it("anularea merge doar cât niciun comision nu e plătit", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    const a = await conecteazaCa("admin");
    expect((await a.rpc("anuleaza_incasare", { t })).error).toBeNull();
    expect((await admin().from("transe").select("incasata_la, incasat_lei").eq("id", t).single()).data).toEqual({ incasata_la: null, incasat_lei: null });
    expect(await comisioaneDin(t)).toEqual([]);

    await incaseaza(t, 2000);
    await a.from("comisioane").update({ platit_la: azi() }).eq("transa_id", t);
    expect((await a.rpc("anuleaza_incasare", { t })).error?.message).toBe("Ai plătit deja un comision din ea. Folosește returnarea.");
  });

  it("doar Adminul încasează", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 2000);
    const k = await conecteazaCa("constructor");
    expect((await k.rpc("incaseaza", { t, suma: 2000, zi: azi(), peste: false })).error).not.toBeNull();
    expect((await k.rpc("anuleaza_incasare", { t })).error).not.toBeNull();
  });
});

/** Un proiect cu Radu 30% și callerul 10% și o încasare de 2.000; comisionul lui Radu e plătit. */
async function incasarePlatitaLaRadu() {
  const { proiectId } = await client();
  await puneConstructor(proiectId, 30);
  await puneCaller(proiectId, 10);
  const t = await transa(proiectId, 2000);
  await incaseaza(t, 2000);
  await admin().from("comisioane").update({ platit_la: azi() }).eq("transa_id", t).eq("om_id", await idDe("constructor"));
  return { proiectId, t };
}

describe("finanțe: returnări și plăți", () => {
  it("returnarea întreagă: comisionul neplătit dispare, cel plătit devine minus", async () => {
    const { t } = await incasarePlatitaLaRadu();
    const a = await conecteazaCa("admin");
    expect((await a.rpc("returneaza", { t, suma: 2000, zi: azi() })).error).toBeNull();
    const k = await comisioaneDin(t);
    expect(k.map((x) => [x.tip, x.suma_lei, x.platit_la === null])).toEqual([
      ["minus", -600, true],
      ["comision", 600, false],
    ]);
    const caller = await idDe("caller");
    expect(k.find((x) => x.om_id === caller)).toBeUndefined();
    expect((await admin().from("transe").select("returnat_lei").eq("id", t).single()).data).toEqual({ returnat_lei: 2000 });
  });

  it("returnarea parțială scade proporțional", async () => {
    const { t } = await incasarePlatitaLaRadu();
    const a = await conecteazaCa("admin");
    expect((await a.rpc("returneaza", { t, suma: 500, zi: azi() })).error).toBeNull();
    const k = await comisioaneDin(t);
    expect(k.find((x) => x.tip === "comision" && x.platit_la === null)).toMatchObject({ suma_lei: 150, baza_lei: 1500 });
    expect(k.find((x) => x.tip === "minus")).toMatchObject({ suma_lei: -150, baza_lei: -500 });
    expect((await a.rpc("returneaza", { t, suma: 1600, zi: azi() })).error?.message).toBe("Poți returna cel mult 1.500 lei.");
  });

  it("„Am plătit tot” stinge minusurile și întoarce diferența", async () => {
    const { proiectId, t } = await incasarePlatitaLaRadu();
    const a = await conecteazaCa("admin");
    await a.rpc("returneaza", { t, suma: 2000, zi: azi() });
    const t2 = await transa(proiectId, 3000);
    await incaseaza(t2, 3000);
    const radu = await idDe("constructor");
    const r = await a.rpc("plateste_tot", { om: radu, zi: azi() });
    expect(r.error).toBeNull();
    expect(r.data).toBeGreaterThanOrEqual(300);
    const { data } = await admin().from("comisioane").select("platit_la").eq("proiect_id", proiectId).eq("om_id", radu);
    expect(data!.every((x) => x.platit_la !== null)).toBe(true);
  });

  it("„Am plătit tot” refuză când totalul e zero sau negativ", async () => {
    const om = await omTemporar("constructor");
    const { proiectId } = await client();
    await admin().from("proiect_oameni").insert({ proiect_id: proiectId, om_id: om, procent: 30 });
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    const a = await conecteazaCa("admin");
    await a.from("comisioane").update({ platit_la: azi() }).eq("transa_id", t);
    await a.rpc("returneaza", { t, suma: 2000, zi: azi() });
    expect((await a.rpc("plateste_tot", { om, zi: azi() })).error?.message).toBe("Nu e nimic de plătit.");
  });

  it("bifa pe un rând cu procent nestabilit e refuzată", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, null);
    const t = await transa(proiectId, 2000);
    await incaseaza(t, 2000);
    const a = await conecteazaCa("admin");
    expect((await a.from("comisioane").update({ platit_la: azi() }).eq("transa_id", t)).error?.message).toBe("Procentul nu e stabilit încă.");
  });

  it("doar Adminul returnează și plătește", async () => {
    const { t } = await incasarePlatitaLaRadu();
    const k = await conecteazaCa("constructor");
    expect((await k.rpc("returneaza", { t, suma: 100, zi: azi() })).error).not.toBeNull();
    expect((await k.rpc("plateste_tot", { om: await idDe("constructor"), zi: azi() })).error).not.toBeNull();
    expect((await k.from("comisioane").update({ platit_la: null }).eq("transa_id", t).select("id")).data ?? []).toEqual([]);
  });
});

const peste = (n: number) => ziuaPeste(new Date(), n);

async function setBaza(categorie: string, rol: "caller" | "closer" | "constructor", procent: number | null) {
  const { error } = await admin().from("procente_baza").update({ procent }).eq("categorie", categorie).eq("rol", rol);
  if (error) throw error;
}

describe("finanțe: mentenanța, mutarea și vederile omului", () => {
  it("pornirea abonamentului face tranșele lunilor până la +35 de zile", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const a = await conecteazaCa("admin");
    const r = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 5, porneste: azi(), om: await idDe("constructor") });
    expect(r.error).toBeNull();
    const { data } = await admin().from("transe").select("scadenta, eticheta, suma_lei, tip").eq("abonament_id", r.data!).order("scadenta");
    const asteptate: string[] = [];
    for (let i = 0; i <= 2; i++) {
      const [an, luna] = peste(0).split("-").map(Number);
      const d = new Date(Date.UTC(an, luna - 1 + i, 5)).toISOString().slice(0, 10);
      if (d >= azi() && d <= peste(35)) asteptate.push(d);
    }
    expect(data!.map((x) => x.scadenta)).toEqual(asteptate);
    expect(data!.every((x) => x.suma_lei === 300 && x.tip === "mentenanta" && /^Mentenanță [a-zăâîșț]+$/.test(x.eticheta))).toBe(true);
    expect((await a.rpc("genereaza_mentenanta", { pana: peste(35) })).data).toBe(0);
  });

  it("comisionul de mentenanță merge la omul abonamentului, nu la lista proiectului", async () => {
    await setBaza("mentenanta", "constructor", 50);
    const { proiectId } = await client({ caller_id: await idDe("caller") });
    await puneConstructor(proiectId, 30);
    await puneCaller(proiectId, 10);
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 1, porneste: peste(-40), om: await idDe("constructor") });
    expect(ab.error).toBeNull();
    const { data: t } = await admin().from("transe").select("id").eq("abonament_id", ab.data!).order("scadenta").limit(1).single();
    await incaseaza(t!.id, 300);
    expect((await comisioaneDin(t!.id)).map((x) => [x.om_id, x.procent, x.suma_lei])).toEqual([[await idDe("constructor"), 50, 150]]);
    await setBaza("mentenanta", "constructor", null);
  });

  it("oprirea șterge tranșele viitoare, nu și pe cele întârziate", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 28, porneste: azi(), om: null as unknown as string });
    expect(ab.error).toBeNull();
    const ins = await admin().from("transe").insert({ proiect_id: proiectId, abonament_id: ab.data!, tip: "mentenanta", eticheta: "Mentenanță veche", suma_lei: 300, scadenta: peste(-10) });
    expect(ins.error).toBeNull();
    expect((await a.rpc("opreste_abonament", { a: ab.data! })).error).toBeNull();
    const { data } = await admin().from("transe").select("eticheta").eq("abonament_id", ab.data!);
    expect(data).toEqual([{ eticheta: "Mentenanță veche" }]);
    expect((await admin().from("abonamente").select("oprit_la").eq("id", ab.data!).single()).data).toEqual({ oprit_la: azi() });
  });

  it("schimbarea abonamentului refață tranșele viitoare cu suma nouă", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 28, porneste: azi(), om: null as unknown as string });
    expect((await a.rpc("schimba_abonament", { a: ab.data!, suma: 450, zi: 28 })).error).toBeNull();
    const { data } = await admin().from("transe").select("suma_lei").eq("abonament_id", ab.data!);
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((x) => x.suma_lei === 450)).toBe(true);
  });

  it("comisioane_viitoare: omul își vede tranșele fără nicio dată și fără «· rest», fără proiectele altora", async () => {
    const nume = `Viitoare ${Date.now()}`;
    const { proiectId } = await client({ nume });
    await puneConstructor(proiectId, 30);
    await transa(proiectId, 1000, peste(10), "Restul");
    await transa(proiectId, 2000, peste(-3), "Avans");
    // plată parțială: restul neîncasat poartă eticheta «Rata 1 · rest» în baza de date
    const r = await transa(proiectId, 1000, peste(5), "Rata 1");
    expect((await incaseaza(r, 400)).error).toBeNull();
    const k = await conecteazaCa("constructor");
    const { data, error } = await k.rpc("comisioane_viitoare");
    expect(error).toBeNull();
    const ale_mele = data!.filter((x) => x.client === nume);
    expect(ale_mele.every((x) => !("scadenta" in x))).toBe(true);
    expect(ale_mele.map((x) => [x.eticheta, x.comision])).toEqual([
      ["Avans", 600],
      ["Rata 1", 180],
      ["Restul", 300],
    ]);
    const altul = await conecteazaCa("caller2");
    expect(((await altul.rpc("comisioane_viitoare")).data ?? []).filter((x) => x.client === nume)).toEqual([]);
  });

  it("comisioanele_mele dă «client» null după ștergerea clientului", async () => {
    const nume = `Mele ${Date.now()}`;
    const { clientId, proiectId } = await client({ nume });
    await puneConstructor(proiectId, 30);
    const t = await transa(proiectId, 1000);
    await incaseaza(t, 1000);
    const k = await conecteazaCa("constructor");
    const inainte = (await k.rpc("comisioanele_mele")).data!.find((x) => x.client === nume);
    expect(inainte).toMatchObject({ eticheta: "Avans", procent: 30, baza_lei: 1000, suma_lei: 300, platit_la: null, tip: "comision" });

    const a = await conecteazaCa("admin");
    await a.from("comisioane").update({ platit_la: azi() }).eq("transa_id", t);
    expect((await a.rpc("sterge_client", { c: clientId })).error).toBeNull();
    const dupa = (await k.rpc("comisioanele_mele")).data!.find((x) => x.id === inainte!.id);
    expect(dupa).toMatchObject({ client: null, suma_lei: 300 });
    // ceilalți nu-i văd comisioanele
    expect(((await (await conecteazaCa("caller")).rpc("comisioanele_mele")).data ?? []).find((x) => x.id === inainte!.id)).toBeUndefined();
  });

  it("„Mută tot la…” pune omul nou cu procentul de bază", async () => {
    await setBaza("site", "constructor", 35);
    const plecat = await omTemporar("constructor");
    const { proiectId } = await client({ serviciu: "site" });
    await admin().from("proiect_oameni").insert({ proiect_id: proiectId, om_id: plecat, procent: 20 });
    await admin().from("taskuri").insert({ proiect_id: proiectId, titlu: "De mutat", om_id: plecat });
    const a = await conecteazaCa("admin");
    expect((await a.rpc("muta_taskuri", { de: plecat, la: await idDe("constructor") })).error).toBeNull();
    const { data } = await admin().from("proiect_oameni").select("procent").eq("proiect_id", proiectId).eq("om_id", await idDe("constructor")).single();
    expect(data).toEqual({ procent: 35 });
    await setBaza("site", "constructor", null);
  });
});

describe("finanțe: reparațiile de după verificare", () => {
  it("o lună de mentenanță ștearsă nu revine, iar una mutată în luna următoare nu face o a doua", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 28, porneste: peste(-40), om: null as unknown as string });
    expect(ab.error).toBeNull();
    const toate = async () => (await admin().from("transe").select("id, scadenta").eq("abonament_id", ab.data!).order("scadenta")).data!;
    const inainte = await toate();
    expect(inainte.length).toBeGreaterThanOrEqual(2);

    // ștearsă (clientul a sărit o lună)
    expect((await a.from("transe").delete().eq("id", inainte[0].id)).error).toBeNull();
    // mutată în luna următoare
    const mutata = inainte[1];
    const [an, luna, zi] = mutata.scadenta.split("-").map(Number);
    const lunaUrm = new Date(Date.UTC(an, luna, Math.min(zi, 28))).toISOString().slice(0, 10);
    expect((await a.from("transe").update({ scadenta: lunaUrm }).eq("id", mutata.id)).error).toBeNull();

    expect((await a.rpc("genereaza_mentenanta", { pana: peste(35) })).data).toBe(0);
    const dupa = await toate();
    expect(dupa.map((x) => x.id)).not.toContain(inainte[0].id);
    expect(dupa.filter((x) => x.scadenta.slice(0, 7) === mutata.scadenta.slice(0, 7))).toEqual([]);
    expect(dupa.filter((x) => x.scadenta.slice(0, 7) === lunaUrm.slice(0, 7))).toHaveLength(1);
  });

  it("schimbarea sumei refață lunile viitoare, chiar dacă fuseseră deja făcute", async () => {
    const { proiectId } = await client();
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 28, porneste: azi(), om: null as unknown as string });
    const n = (await admin().from("transe").select("id").eq("abonament_id", ab.data!)).data!.length;
    expect((await a.rpc("schimba_abonament", { a: ab.data!, suma: 450, zi: 27 })).error).toBeNull();
    const { data } = await admin().from("transe").select("suma_lei").eq("abonament_id", ab.data!);
    expect(data!.length).toBe(n);
    expect(data!.every((x) => x.suma_lei === 450)).toBe(true);
  });

  it("«Doar eu» la mentenanță: fără om, nimeni de pe proiect nu primește comision", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, 30);
    const a = await conecteazaCa("admin");
    const ab = await a.rpc("porneste_abonament", { p: proiectId, suma: 300, zi: 28, porneste: azi(), om: null as unknown as string });
    expect(ab.error).toBeNull();
    const { data } = await admin().from("abonament_oameni").select("om_id").eq("abonament_id", ab.data!).eq("om_id", await idDe("constructor"));
    expect(data).toEqual([]);
  });

  it("un om cu comisioane fără procent nu se scoate de pe proiect până nu i se pune procentul", async () => {
    const { proiectId } = await client();
    await puneConstructor(proiectId, null);
    await puneCaller(proiectId, null);
    const t = await transa(proiectId, 1000);
    expect((await incaseaza(t, 1000)).error).toBeNull();
    const a = await conecteazaCa("admin");

    const scoateK = await a.from("proiect_oameni").delete().eq("proiect_id", proiectId).eq("om_id", await idDe("constructor"));
    expect(scoateK.error?.message).toBe("Are comisioane fără procent pe proiect. Pune-i întâi procentul (0 dacă nu primește nimic).");
    const scoateC = await a.from("proiect_vanzari").delete().eq("proiect_id", proiectId).eq("om_id", await idDe("caller"));
    expect(scoateC.error?.message).toBe("Are comisioane fără procent pe proiect. Pune-i întâi procentul (0 dacă nu primește nimic).");

    expect((await a.from("proiect_oameni").upsert({ proiect_id: proiectId, om_id: await idDe("constructor"), procent: 30 }, { onConflict: "proiect_id,om_id" })).error).toBeNull();
    expect((await a.from("proiect_vanzari").upsert({ proiect_id: proiectId, om_id: await idDe("caller"), procent: 0 }, { onConflict: "proiect_id,om_id" })).error).toBeNull();
    expect((await a.from("proiect_oameni").delete().eq("proiect_id", proiectId).eq("om_id", await idDe("constructor"))).error).toBeNull();
    expect((await a.from("proiect_vanzari").delete().eq("proiect_id", proiectId).eq("om_id", await idDe("caller"))).error).toBeNull();
  });

  it("procentul unui om cu contul oprit se poate pune după încasare", async () => {
    const { proiectId } = await client();
    const k = await omTemporar("constructor");
    const c = await omTemporar("caller");
    expect((await admin().from("proiect_oameni").insert({ proiect_id: proiectId, om_id: k, procent: null })).error).toBeNull();
    expect((await admin().from("proiect_vanzari").insert({ proiect_id: proiectId, om_id: c, procent: null })).error).toBeNull();
    const t = await transa(proiectId, 1000);
    expect((await incaseaza(t, 1000)).error).toBeNull();
    await admin().from("profiluri").update({ activ: false }).in("id", [k, c]);

    const a = await conecteazaCa("admin");
    expect((await a.from("proiect_oameni").upsert({ proiect_id: proiectId, om_id: k, procent: 25 }, { onConflict: "proiect_id,om_id" })).error).toBeNull();
    expect((await a.from("proiect_vanzari").upsert({ proiect_id: proiectId, om_id: c, procent: 10 }, { onConflict: "proiect_id,om_id" })).error).toBeNull();
    const sume = (await comisioaneDin(t)).map((x) => [x.om_id, x.suma_lei]);
    expect(sume).toEqual(expect.arrayContaining([[k, 250], [c, 100]]));
    // un om nou cu contul oprit tot nu se poate pune
    const altul = await omTemporar("constructor", false);
    expect((await a.from("proiect_oameni").insert({ proiect_id: proiectId, om_id: altul, procent: 10 })).error?.message).toBe("Pe proiect se pun doar constructori cu contul pornit.");
  });
});
