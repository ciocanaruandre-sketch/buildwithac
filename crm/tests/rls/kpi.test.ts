import { afterEach, describe, expect, it } from "vitest";
import type { Database, Json } from "@/lib/baza.types";
import { admin, conecteazaCa, idDe, leadDeTest, omTemporar, sterge, stergeTemporari } from "./ajutor";

// Toate datele stau în martie 2001 (perioada) și februarie 2001 (perioada de dinainte):
// datele demo și cele ale altor teste nu ajung acolo.
const DE = "2001-03-01T00:00:00+02:00";
const PANA = "2001-04-01T00:00:00+03:00";
const P = { de: DE, pana: PANA };
/** 2001-03-<zi>, ora României (+02 până pe 25 martie). */
const M = (zi: number, ora = 10, min = 0) => new Date(Date.UTC(2001, 2, zi, ora - 2, min)).toISOString();
const IAN = (zi: number) => new Date(Date.UTC(2001, 0, zi, 8)).toISOString();
const FEB = (zi: number) => new Date(Date.UTC(2001, 1, zi, 8)).toISOString();
const APR = (zi: number) => new Date(Date.UTC(2001, 3, zi, 7)).toISOString();

const deSters: string[] = [];
afterEach(async () => {
  for (const id of deSters.splice(0)) await sterge(id);
  await stergeTemporari();
});

type LeadInsert = Partial<Database["public"]["Tables"]["lead_uri"]["Insert"]>;
/** Un lead fără Parcursul pus de trigger la creare: evenimentele le pune testul, în 2001. */
async function lead(camp: LeadInsert = {}) {
  const l = await leadDeTest(camp);
  deSters.push(l.id);
  await admin().from("evenimente").delete().eq("lead_id", l.id);
  return l;
}
async function ev(lead_id: string, tip: string, la: string, autor_id: string | null = null, detalii: { [k: string]: Json } = {}) {
  const { error } = await admin().from("evenimente").insert({ lead_id, tip, la, autor_id, detalii });
  if (error) throw error;
}
/** Un lead intrat la `la`, cu evenimentul `creat`. */
async function intrat(la: string, camp: LeadInsert = {}) {
  const l = await lead(camp);
  await ev(l.id, "creat", la, null, { sursa: l.sursa });
  return l;
}
async function discutie(lead_id: string, closer_id: string, incepe: string, neprezentat = false) {
  const sfarseste = new Date(new Date(incepe).getTime() + 30 * 60_000).toISOString();
  const { error } = await admin()
    .from("discutii")
    .insert({ lead_id, closer_id, incepe_la: incepe, sfarseste_la: sfarseste, neprezentat_la: neprezentat ? incepe : null });
  if (error) throw error;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rand = Record<string, any>;
async function rpcAdmin(fn: string, p = P): Promise<Rand[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (await conecteazaCa("admin")).rpc(fn as any, p as any);
  if (error) throw error;
  return data as Rand[];
}
const randOm = (r: Rand[], om: string) => r.find((x) => x.om_id === om);
const total = (r: Rand[]) => r.find((x) => x.om_id === null);

describe("kpi_apeluri", () => {
  it("un Nu răspunde (două evenimente) e un singur apel", async () => {
    const om = await omTemporar("caller");
    const l = await intrat(M(5, 9), { caller_id: om });
    await ev(l.id, "stare", M(5, 10), om, { de: "nou", in: "fara_raspuns" });
    await ev(l.id, "incercare", M(5, 10), om, { nr: 1 });
    expect(randOm(await rpcAdmin("kpi_apeluri"), om)?.apeluri).toBe(1);
  });

  it("Nu răspunde și A răspuns în 3 minute sunt un apel; după 15 minute sunt două", async () => {
    const om = await omTemporar("caller");
    const a = await intrat(M(6, 9), { caller_id: om });
    await ev(a.id, "stare", M(6, 10), om, { de: "nou", in: "fara_raspuns" });
    await ev(a.id, "incercare", M(6, 10), om, { nr: 1 });
    await ev(a.id, "stare", M(6, 10, 3), om, { de: "fara_raspuns", in: "a_raspuns" });
    // „Programează” pornește din a_raspuns: nu e apel
    await ev(a.id, "stare", M(6, 10, 4), om, { de: "a_raspuns", in: "programat" });
    const b = await intrat(M(7, 9), { caller_id: om });
    await ev(b.id, "stare", M(7, 10), om, { de: "nou", in: "fara_raspuns" });
    await ev(b.id, "incercare", M(7, 10), om, { nr: 1 });
    await ev(b.id, "stare", M(7, 10, 15), om, { de: "fara_raspuns", in: "a_raspuns" });
    expect(randOm(await rpcAdmin("kpi_apeluri"), om)?.apeluri).toBe(3);
  });

  it("timpul până la primul apel e mediana", async () => {
    const om = await omTemporar("caller");
    for (const [zi, minute] of [[8, 10], [9, 30], [10, 600]] as const) {
      const l = await intrat(M(zi, 8), { caller_id: om });
      await ev(l.id, "incercare", new Date(new Date(M(zi, 8)).getTime() + minute * 60_000).toISOString(), om, { nr: 1 });
    }
    expect(Number(randOm(await rpcAdmin("kpi_apeluri"), om)?.minute_primul_apel)).toBe(30);
  });

  it("nesunate peste 24 h", async () => {
    const om = await omTemporar("caller");
    const sunatTarziu = await intrat(M(11, 8), { caller_id: om });
    await ev(sunatTarziu.id, "incercare", M(12, 9), om, { nr: 1 });
    await intrat(M(13, 8), { caller_id: om });
    const sunatRepede = await intrat(M(14, 8), { caller_id: om });
    await ev(sunatRepede.id, "incercare", M(14, 9), om, { nr: 1 });
    expect(randOm(await rpcAdmin("kpi_apeluri"), om)?.nesunate_24h).toBe(2);
  });

  it("au răspuns, programate și încercările până răspunde", async () => {
    const om = await omTemporar("caller");
    const l = await intrat(M(15, 8), { caller_id: om });
    await ev(l.id, "incercare", M(15, 9), om, { nr: 1 });
    await ev(l.id, "incercare", M(15, 15), om, { nr: 2 });
    await ev(l.id, "stare", M(16, 10), om, { de: "fara_raspuns", in: "a_raspuns" });
    await ev(l.id, "programat", M(16, 10, 2), om, { closer: om, la: M(20) });
    await ev(l.id, "programat", M(17, 10), om, { closer: om, la: M(21) });
    const r = randOm(await rpcAdmin("kpi_apeluri"), om)!;
    expect(r.au_raspuns).toBe(1);
    expect(r.programate).toBe(1);
    expect(Number(r.incercari_pana_raspunde)).toBe(2);
  });

  it("„au răspuns” vine doar dintr-un apel: oferta, clientul și pierdutul de după discuție nu-i dau closerului răspunsuri", async () => {
    const closer = await omTemporar("closer");
    const l = await intrat(M(15, 8), { closer_id: closer });
    await ev(l.id, "stare", M(18, 12), closer, { de: "programat", in: "oferta_trimisa" });
    await ev(l.id, "stare", M(22, 12), closer, { de: "oferta_trimisa", in: "client" });
    const l2 = await intrat(M(15, 9), { closer_id: closer });
    await ev(l2.id, "stare", M(18, 13), closer, { de: "programat", in: "pierdut", categorie: "prea_scump" });
    expect(randOm(await rpcAdmin("kpi_apeluri"), closer)?.au_raspuns ?? 0).toBe(0);
  });

  it("rata de programare pe răspunsurile perioadei: programat mai târziu intră, răspuns de dinainte nu", async () => {
    const om = await omTemporar("caller");
    const vechi = await intrat(FEB(20), { caller_id: om });
    await ev(vechi.id, "stare", FEB(27), om, { de: "nou", in: "a_raspuns" });
    await ev(vechi.id, "programat", M(2), om, { closer: om, la: M(6) });
    const nou = await intrat(M(29), { caller_id: om });
    await ev(nou.id, "stare", M(30), om, { de: "nou", in: "a_raspuns" });
    await ev(nou.id, "programat", APR(2), om, { closer: om, la: APR(6) });
    expect(randOm(await rpcAdmin("kpi_apeluri"), om)).toMatchObject({ au_raspuns: 1, programate: 1, programate_din_raspuns: 1 });
  });

  it("callerul vede doar rândul lui, chiar fără activitate", async () => {
    const { data, error } = await (await conecteazaCa("caller")).rpc("kpi_apeluri", P);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].om_id).toBe(await idDe("caller"));
  });
});

describe("kpi_palnie și kpi_surse", () => {
  it("lead-ul reintrat e o intrare nouă", async () => {
    const om = await omTemporar("caller");
    const l = await lead({ caller_id: om, stare: "client", sursa: "formular_site" });
    await ev(l.id, "creat", IAN(10), null, { sursa: "formular_site" });
    await ev(l.id, "stare", IAN(11), om, { de: "nou", in: "pierdut" });
    const c = await admin().from("cereri").insert({ lead_id: l.id, sursa: "reclama_meta", primita_la: M(10, 9, 59) });
    expect(c.error).toBeNull();
    await ev(l.id, "redeschis", M(10, 10), null, {});
    await ev(l.id, "stare", M(11, 10), om, { de: "nou", in: "a_raspuns" });
    await ev(l.id, "stare", M(20, 10), om, { de: "oferta_trimisa", in: "client" });

    const inainte = (await rpcAdmin("kpi_palnie"))[0];
    expect(inainte.intrari).toBeGreaterThanOrEqual(1);
    // doar lead-ul ăsta are intrări în martie 2001
    expect(inainte).toMatchObject({ intrari: 1, sunate: 1, au_raspuns: 1, oferta: 1, clienti: 1 });
    const surse = await rpcAdmin("kpi_surse");
    expect(surse).toEqual([{ sursa: "reclama_meta", intrari: 1, clienti: 1 }]);
  });

  it("o treaptă nu e mai mare decât cea dinainte: cine a ajuns mai departe a trecut și pe aici", async () => {
    const om = await omTemporar("caller");
    const l = await intrat(M(10), { caller_id: om });
    await ev(l.id, "stare", M(11), om, { de: "nou", in: "a_raspuns" });
    await ev(l.id, "stare", M(12), om, { de: "a_raspuns", in: "oferta_trimisa" });
    expect((await rpcAdmin("kpi_palnie"))[0]).toMatchObject({ intrari: 1, sunate: 1, au_raspuns: 1, programate: 1, au_venit: 1, oferta: 1, clienti: 0 });
  });

  it("callerul nu primește nimic din pâlnie și surse", async () => {
    const db = await conecteazaCa("caller");
    for (const fn of ["kpi_palnie", "kpi_surse"] as const) {
      const { data, error } = await db.rpc(fn, P);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    }
  });

  it("lead-urile fără nume rămân în cifre", async () => {
    const l = await intrat(M(12, 10), { stare: "pierdut", intrat_la: new Date(Date.now() - 400 * 86_400_000).toISOString() });
    expect((await admin().rpc("anonimizeaza_vechi", { zile: 365 })).error).toBeNull();
    const { data } = await admin().from("lead_uri").select("anonimizat_la").eq("id", l.id).single();
    expect(data?.anonimizat_la).not.toBeNull();
    expect((await rpcAdmin("kpi_palnie"))[0].intrari).toBe(1);
  });
});

describe("kpi_inchideri", () => {
  it("rata de prezentare numără doar discuțiile începute și nemarcate", async () => {
    const closer = await omTemporar("closer");
    const l = await intrat(M(2), { closer_id: closer, stare: "programat" });
    await discutie(l.id, closer, M(3, 10));
    await discutie(l.id, closer, M(4, 10));
    await discutie(l.id, closer, M(5, 10), true);
    expect(randOm(await rpcAdmin("kpi_inchideri"), closer)).toMatchObject({ programate: 3, au_venit: 2 });
  });

  it("vândut după proiect_vanzari, cu a doua vânzare", async () => {
    const closer = await idDe("closer");
    const l = await intrat(M(2), { closer_id: closer, stare: "client" });
    const c = await admin().from("clienti").insert({ lead_id: l.id, nume: "Test KPI", serviciu: "site", sursa: "formular_site", closer_id: closer }).select("id").single();
    expect(c.error).toBeNull();
    for (const pret of [1000, 2000]) {
      const p = await admin().from("proiecte").insert({ client_id: c.data!.id, titlu: "Site", serviciu: "site", pret_lei: pret, creat_la: M(15) });
      expect(p.error).toBeNull();
    }
    const r = await rpcAdmin("kpi_inchideri");
    expect(Number(randOm(r, closer)?.vandut_lei)).toBe(3000);
    expect(Number(total(r)?.vandut_lei)).toBe(3000);
  });

  it("rata de închidere pe discuțiile perioadei: clientul de după perioadă intră, discuția de dinainte nu", async () => {
    const closer = await omTemporar("closer");
    const a = await intrat(M(2), { closer_id: closer, stare: "client" });
    await discutie(a.id, closer, M(5, 10));
    await ev(a.id, "stare", APR(3), closer, { de: "oferta_trimisa", in: "client" });
    const b = await intrat(FEB(10), { closer_id: closer, stare: "client" });
    await discutie(b.id, closer, FEB(25));
    await ev(b.id, "stare", M(3), closer, { de: "oferta_trimisa", in: "client" });
    expect(randOm(await rpcAdmin("kpi_inchideri"), closer)).toMatchObject({ au_venit: 1, clienti: 1, clienti_din_discutii: 1 });
  });

  it("closerul vede doar rândul lui, fără bani", async () => {
    const { data, error } = await (await conecteazaCa("closer")).rpc("kpi_inchideri", P);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].om_id).toBe(await idDe("closer"));
    expect(data![0].vandut_lei).toBeNull();
    expect(data![0].fara_pret).toBeNull();
  });

  it("clienți și zilele de la prima discuție avută la client", async () => {
    const closer = await omTemporar("closer");
    const l = await intrat(M(2), { closer_id: closer, stare: "client" });
    await discutie(l.id, closer, M(4, 10), true);
    await discutie(l.id, closer, M(6, 10));
    await ev(l.id, "stare", M(16, 10), closer, { de: "oferta_trimisa", in: "client" });
    const r = randOm(await rpcAdmin("kpi_inchideri"), closer)!;
    expect(r.clienti).toBe(1);
    expect(Number(r.zile_pana_la_client)).toBe(10);
  });
});

describe("kpi_pierderi", () => {
  it("pierderi pe categorie", async () => {
    const closer = await omTemporar("closer");
    for (const zi of [3, 4]) {
      const l = await intrat(M(zi, 8), { closer_id: closer });
      await ev(l.id, "stare", M(zi, 12), closer, { de: "programat", in: "pierdut", categorie: "prea_scump" });
    }
    const d = await intrat(M(5, 8));
    await ev(d.id, "stare", M(5, 12), closer, { de: "a_raspuns", in: "descalificat", categorie: "numar_gresit" });
    const vechi = await intrat(M(6, 8));
    await ev(vechi.id, "stare", M(6, 12), closer, { de: "programat", in: "pierdut", motiv: "Text vechi" });
    const r = await rpcAdmin("kpi_pierderi");
    expect(r).toEqual(
      expect.arrayContaining([
        { stare: "pierdut", categorie: "prea_scump", nr: 2 },
        { stare: "descalificat", categorie: "numar_gresit", nr: 1 },
        { stare: "pierdut", categorie: "altceva", nr: 1 },
      ]),
    );
    expect(r[0]).toEqual({ stare: "pierdut", categorie: "prea_scump", nr: 2 });
  });

  it("callerul nu primește pierderi", async () => {
    const { data, error } = await (await conecteazaCa("caller")).rpc("kpi_pierderi", P);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

/** Un client cu un proiect creat la `creat_la`, cu constructorul `om` pe proiect. */
async function proiect(creat_la: string, om?: string, pret_lei: number | null = null) {
  const l = await lead({ stare: "client" });
  const c = await admin().from("clienti").insert({ lead_id: l.id, nume: "Test KPI", serviciu: "site", sursa: "formular_site" }).select("id").single();
  if (c.error) throw c.error;
  const p = await admin().from("proiecte").insert({ client_id: c.data.id, titlu: "Site", serviciu: "site", pret_lei, creat_la }).select("id").single();
  if (p.error) throw p.error;
  if (om) {
    const o = await admin().from("proiect_oameni").insert({ proiect_id: p.data.id, om_id: om });
    if (o.error) throw o.error;
  }
  return p.data.id;
}
async function stadiu(proiect_id: string, de: string, inn: string, la: string) {
  const { error } = await admin().from("evenimente_proiect").insert({ proiect_id, tip: "stadiu", la, detalii: { de, in: inn } });
  if (error) throw error;
}

describe("kpi_proiecte", () => {
  it("proiectul livrat de două ori se numără o dată, la prima livrare", async () => {
    const om = await omTemporar("constructor");
    const a = await proiect(M(1), om);
    await stadiu(a, "revizii", "livrat", M(10));
    await stadiu(a, "livrat", "revizii", M(12));
    await stadiu(a, "revizii", "livrat", M(20));
    // livrat prima oară în februarie: nu e livrare din martie
    const b = await proiect(IAN(5), om);
    await stadiu(b, "revizii", "livrat", new Date(Date.UTC(2001, 1, 10, 8)).toISOString());
    await stadiu(b, "revizii", "livrat", M(15));
    const r = randOm(await rpcAdmin("kpi_proiecte"), om)!;
    expect(r.livrate).toBe(1);
    expect(Number(r.zile_durata)).toBe(9);
  });

  it("livrările de refăcut, din cele trimise în perioadă", async () => {
    const om = await omTemporar("constructor");
    const p = await proiect(M(1), om);
    for (const [titlu, stare] of [["Schița", "de_refacut"], ["Pagina", "aprobat"]] as const) {
      const { error } = await admin().from("livrari").insert({ proiect_id: p, titlu, stare, adaugat_la: M(5) });
      expect(error).toBeNull();
    }
    expect(randOm(await rpcAdmin("kpi_proiecte"), om)).toMatchObject({ livrari_trimise: 2, livrari_refacute: 1 });
  });

  it("task-ul gata în ziua termenului e la termen; după termen, nu", async () => {
    const om = await omTemporar("constructor");
    const p = await proiect(M(1), om);
    // gata_la îl pune baza (acum): termenul de azi e la termen, cel de ieri nu
    const azi = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());
    const ieri = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date(Date.now() - 86_400_000));
    for (const termen of [azi, ieri]) {
      const { error } = await admin().from("taskuri").insert({ proiect_id: p, titlu: "Pagina", om_id: om, termen, gata: true });
      expect(error).toBeNull();
    }
    // nefăcut, cu termenul de azi: nu se numără încă
    expect((await admin().from("taskuri").insert({ proiect_id: p, titlu: "Meniu", om_id: om, termen: azi })).error).toBeNull();
    const r = randOm(await rpcAdmin("kpi_proiecte", { de: new Date(Date.now() - 3 * 86_400_000).toISOString(), pana: new Date().toISOString() }), om)!;
    expect(r).toMatchObject({ taskuri_cu_termen: 2, taskuri_la_termen: 1 });
  });

  it("constructorul vede doar rândul lui din proiecte; callerul nu vede banii", async () => {
    const { data, error } = await (await conecteazaCa("constructor")).rpc("kpi_proiecte", P);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].om_id).toBe(await idDe("constructor"));
    const caller = await conecteazaCa("caller");
    for (const [fn, p] of [["kpi_bani", P], ["kpi_luni", { luni: 6 }]] as const) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = await caller.rpc(fn as any, p as any);
      expect(r.error).toBeNull();
      expect(r.data).toHaveLength(0);
    }
  });
});

describe("kpi_bani și kpi_luni", () => {
  it("încasat minus returnat; valoarea medie", async () => {
    const p = await proiect(M(1), undefined, 4000);
    await proiect(M(2), undefined, 2000);
    const { error } = await admin().from("transe").insert({
      proiect_id: p, tip: "avans", eticheta: "Avans", suma_lei: 3000, scadenta: "2001-03-05",
      incasata_la: "2001-03-06", incasat_lei: 3000, returnat_lei: 500, returnata_la: "2001-03-20",
    });
    expect(error).toBeNull();
    const [b] = await rpcAdmin("kpi_bani");
    expect(Number(b.incasat_lei)).toBe(2500);
    expect(Number(b.valoare_medie_lei)).toBe(3000);
  });

  it("kpi_luni dă 6 rânduri, de la cea mai veche lună la cea curentă, fără goluri", async () => {
    const r = await rpcAdmin("kpi_luni", { luni: 6 } as never);
    expect(r).toHaveLength(6);
    const luna = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit" }).format(new Date());
    expect(r[5].luna).toBe(`${luna}-01`);
    for (const x of r) {
      expect(typeof x.clienti_noi).toBe("number");
      expect(Number.isFinite(Number(x.incasat_lei))).toBe(true);
    }
  });
});
