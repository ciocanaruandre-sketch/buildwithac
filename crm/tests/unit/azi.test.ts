import { describe, expect, it } from "vitest";
import { cifreSus, ordoneaza, placi, randuriAzi, salut, textIntrat, urmatorul, ziTitlu, type DateAzi, type RandAzi } from "@/lib/azi";
import type { Transa } from "@/lib/finante";
import type { Rol } from "@/lib/tipuri";

// luni, 16 noiembrie 2026, 10:00 ora României (iarna, UTC+2)
const ACUM = new Date("2026-11-16T08:00:00Z");
const H = 3_600_000;
const MIN = 60_000;
const ZI = 24 * H;
const iso = (ms: number) => new Date(ms).toISOString();
const peste = (ms: number) => iso(ACUM.getTime() + ms);

const ADMIN = { id: "a", rol: "admin" as Rol };
const MARA = { id: "m", rol: "caller" as Rol };
const VLAD = { id: "v", rol: "caller" as Rol };
const IOANA = { id: "i", rol: "closer" as Rol };
const RADU = { id: "r", rol: "constructor" as Rol };

const dateGoale = (): DateAzi => ({
  leaduri: [],
  discutii: [],
  taskuri: [],
  proiecte: [],
  oameniProiect: [],
  stadii: [],
  cereri: [],
  clienti: [],
  livrari: [],
  transe: [],
  comisioane: [],
  oameni: [
    { id: "a", nume: "Andrei Ciocănaru" },
    { id: "m", nume: "Mara Ionescu" },
    { id: "v", nume: "Vlad Petrescu" },
    { id: "i", nume: "Ioana Dumitru" },
    { id: "r", nume: "Radu Stan" },
  ],
});

let n = 0;
const lead = (x: Partial<DateAzi["leaduri"][number]> = {}): DateAzi["leaduri"][number] => ({
  id: `l${n++}`,
  nume: "Cosmin Ilie",
  telefon_norm: "40722000111",
  serviciu: "1la1",
  sursa: "reclama_tiktok",
  stare: "nou",
  intrat_la: peste(-2 * H),
  callback_la: null,
  caller_id: null,
  closer_id: null,
  ...x,
});
const proiect = (x: Partial<DateAzi["proiecte"][number]> = {}): DateAzi["proiecte"][number] => ({
  id: `p${n++}`,
  titlu: "Site de prezentare",
  client_id: "c1",
  client: "Laura Ene · Atelier Ceramică",
  telefon: "0722 000 222",
  serviciu: "site",
  stadiu: "constructie",
  termen: null,
  inchis_la: null,
  creat_la: peste(-20 * ZI),
  ...x,
});
const transa = (x: Partial<DateAzi["transe"][number]> = {}): DateAzi["transe"][number] => ({
  id: `t${n++}`,
  proiect_id: "p1",
  tip: "rata",
  eticheta: "Rata 2 din 3",
  suma_lei: 1200,
  scadenta: "2026-11-16",
  incasata_la: null,
  incasat_lei: null,
  returnat_lei: 0,
  abonament_id: null,
  client_id: "c1",
  client: "Laura Ene · Atelier Ceramică",
  telefon: "0722 000 222",
  ...(x as Partial<Transa>),
});

const cu = (f: (d: DateAzi) => void): DateAzi => {
  const d = dateGoale();
  f(d);
  return d;
};
const deTip = (r: RandAzi[], tip: RandAzi["tip"]) => r.filter((x) => x.tip === tip);

describe("pagina Azi: De sunat", () => {
  it("lead nou intrat acum 23h59 e „azi”, la 24h e întârziat", () => {
    const tanar = lead({ intrat_la: peste(-(24 * H - MIN)) });
    const vechi = lead({ intrat_la: peste(-24 * H) });
    const r = randuriAzi(cu((d) => d.leaduri.push(tanar, vechi)), ADMIN, ACUM);
    const t = r.find((x) => x.lead?.id === tanar.id)!;
    const v = r.find((x) => x.lead?.id === vechi.id)!;
    expect(t.urgenta).toBe("azi");
    expect(t.la).toBe(new Date(tanar.intrat_la).getTime());
    expect(v.urgenta).toBe("intarziat");
    expect(v.la).toBe(ACUM.getTime());
    expect(v.tema).toBe("sunat");
    expect(v.numeAscuns).toBe(true);
    expect(v.descriere).toEqual(["Sesiune 1 la 1 / ghid", "Reclamă TikTok"]);
    expect(v.href).toBe(`/lead-uri/${vechi.id}`);
    expect(v.telefonNorm).toBe("40722000111");
  });

  it("textIntrat: „intrat acum 25 min”, „intrat acum o oră”, „intrat acum 3 ore”, „intrat ieri, 18:40”", () => {
    expect(textIntrat(peste(-25 * MIN), ACUM)).toBe("intrat acum 25 min");
    expect(textIntrat(peste(-10 * 1000), ACUM)).toBe("intrat acum 1 min");
    expect(textIntrat(peste(-70 * MIN), ACUM)).toBe("intrat acum o oră");
    expect(textIntrat(peste(-3 * H - 5 * MIN), ACUM)).toBe("intrat acum 3 ore");
    expect(textIntrat("2026-11-15T16:40:00Z", ACUM)).toBe("intrat ieri, 18:40");
  });

  it("callerul vede lead-urile lui și pe cele nepreluate, nu pe ale lui Vlad; adminul le vede pe toate", () => {
    const alMarei = lead({ caller_id: "m" });
    const liber = lead({ caller_id: null });
    const alLuiVlad = lead({ caller_id: "v" });
    const caCloser = lead({ caller_id: "v", closer_id: "m" });
    const d = cu((x) => x.leaduri.push(alMarei, liber, alLuiVlad, caCloser));
    const ids = (r: RandAzi[]) => r.map((x) => x.lead!.id).sort();
    expect(ids(randuriAzi(d, MARA, ACUM))).toEqual([alMarei.id, liber.id, caCloser.id].sort());
    expect(ids(randuriAzi(d, ADMIN, ACUM))).toEqual([alMarei.id, liber.id, alLuiVlad.id, caCloser.id].sort());
  });

  it("callback-ul de mâine nu apare; cel de la 11:30 e „azi, 11:30”; cel de ieri e „trebuia ieri, 16:00”", () => {
    const maine = lead({ stare: "callback", caller_id: "m", callback_la: "2026-11-17T08:00:00Z" });
    const azi = lead({ stare: "callback", caller_id: "m", callback_la: "2026-11-16T09:30:00Z" });
    const ieri = lead({ stare: "callback", caller_id: "m", callback_la: "2026-11-15T14:00:00Z" });
    const alLuiVlad = lead({ stare: "callback", caller_id: "v", callback_la: "2026-11-16T09:30:00Z" });
    const r = randuriAzi(cu((d) => d.leaduri.push(maine, azi, ieri, alLuiVlad)), MARA, ACUM);
    expect(r.map((x) => x.lead!.id)).not.toContain(maine.id);
    expect(r.map((x) => x.lead!.id)).not.toContain(alLuiVlad.id);
    const a = r.find((x) => x.lead!.id === azi.id)!;
    expect(a).toMatchObject({ tip: "callback", urgenta: "azi", cand: "azi, 11:30", la: new Date(azi.callback_la!).getTime() });
    const i = r.find((x) => x.lead!.id === ieri.id)!;
    expect(i).toMatchObject({ tip: "callback", urgenta: "intarziat", cand: "trebuia ieri, 16:00" });
  });

  it("la 00:30 ora României, callback-ul de la 23:50 de ieri și task-ul cu termen ieri sunt întârziate", () => {
    const noaptea = new Date("2026-11-16T22:30:00Z"); // 00:30 pe 17 noiembrie
    const d = cu((x) => {
      x.leaduri.push(lead({ stare: "callback", callback_la: "2026-11-16T21:50:00Z" }));
      x.taskuri.push({ id: "tk", titlu: "Pozele", om_id: "a", termen: "2026-11-16", proiect_id: "p1", proiect: "Site", client_id: "c1", client: "Laura" });
    });
    const r = randuriAzi(d, ADMIN, noaptea);
    expect(deTip(r, "callback")[0].urgenta).toBe("intarziat");
    expect(deTip(r, "task")[0]).toMatchObject({ urgenta: "intarziat", cand: "întârziat o zi" });
  });
});

describe("pagina Azi: Discuții", () => {
  const disc = (incepe: string, closer = "i") => ({ id: `d${n++}`, lead_id: `l${n++}`, closer_id: closer, incepe_la: incepe, lead: { nume: "Ana Popescu", telefon_norm: "40722000333", serviciu: "site" as const } });

  it("a început acum 15 min: apare, curând; acum 16: nu; peste 15: curând; peste 16: nu e curând; poimâine: nu apare", () => {
    const d = cu((x) => x.discutii.push(disc(peste(-15 * MIN)), disc(peste(-16 * MIN)), disc(peste(15 * MIN)), disc(peste(16 * MIN)), disc("2026-11-18T08:00:00Z"), disc("2026-11-17T08:00:00Z")));
    const r = randuriAzi(d, IOANA, ACUM);
    const dupa = (t: string) => r.find((x) => x.la === new Date(t).getTime());
    expect(dupa(peste(-15 * MIN))).toMatchObject({ curand: true, urgenta: "azi" });
    expect(dupa(peste(-16 * MIN))).toBeUndefined();
    expect(dupa(peste(15 * MIN))?.curand).toBe(true);
    expect(dupa(peste(16 * MIN))?.curand).toBe(false);
    expect(dupa("2026-11-18T08:00:00Z")).toBeUndefined();
    expect(dupa("2026-11-17T08:00:00Z")).toMatchObject({ urgenta: "urmeaza", cand: "mâine, 10:00", tema: "discutii" });
  });

  it("closerul vede doar discuțiile lui; adminul le vede pe toate, cu „cu tine” / „cu Ioana”", () => {
    const aIoanei = disc(peste(2 * H), "i");
    const aMea = disc(peste(3 * H), "a");
    const d = cu((x) => x.discutii.push(aIoanei, aMea));
    expect(randuriAzi(d, IOANA, ACUM).map((x) => x.cheie)).toEqual([`discutie:${aIoanei.id}`]);
    const r = randuriAzi(d, ADMIN, ACUM);
    expect(r.find((x) => x.cheie === `discutie:${aIoanei.id}`)!.descriere).toEqual(["Site", "cu Ioana"]);
    expect(r.find((x) => x.cheie === `discutie:${aMea.id}`)!).toMatchObject({ descriere: ["Site", "cu tine"], href: `/lead-uri/${aMea.lead_id}`, numeAscuns: true });
  });
});

describe("pagina Azi: Lucru", () => {
  const task = (x: Partial<DateAzi["taskuri"][number]>) => ({ id: `k${n++}`, titlu: "Pagina de meniu", om_id: "r", termen: "2026-11-16", proiect_id: "p1", proiect: "Site de prezentare", client_id: "c1", client: "Laura Ene · Atelier Ceramică", ...x });

  it("fără termen nu apare; peste 7 zile apare, peste 8 nu; constructorul doar ale lui; adminul „tu”, „Radu”, „neatribuit”", () => {
    const fara = task({ termen: null });
    const sapte = task({ termen: "2026-11-23" });
    const opt = task({ termen: "2026-11-24" });
    const alMeu = task({ om_id: "a", termen: "2026-11-14" });
    const nimeni = task({ om_id: null, termen: "2026-11-17" });
    const d = cu((x) => x.taskuri.push(fara, sapte, opt, alMeu, nimeni));
    expect(randuriAzi(d, RADU, ACUM).map((x) => x.taskId)).toEqual([sapte.id]);
    const r = randuriAzi(d, ADMIN, ACUM);
    expect(r.map((x) => x.taskId).sort()).toEqual([sapte.id, alMeu.id, nimeni.id].sort());
    expect(r.find((x) => x.taskId === sapte.id)!).toMatchObject({ nume: "Pagina de meniu", numeAscuns: false, client: "Laura Ene · Atelier Ceramică", descriere: ["Site de prezentare", "Radu"], urgenta: "urmeaza", cand: "23 nov.", tema: "lucru", href: "/clienti/c1?proiect=p1" });
    expect(r.find((x) => x.taskId === alMeu.id)!).toMatchObject({ descriere: ["Site de prezentare", "tu"], urgenta: "intarziat", cand: "întârziat 2 zile" });
    expect(r.find((x) => x.taskId === nimeni.id)!).toMatchObject({ descriere: ["Site de prezentare", "neatribuit"], cand: "mâine" });
  });

  it("task azi: „azi”, fără oră", () => {
    const r = randuriAzi(cu((x) => x.taskuri.push(task({}))), RADU, ACUM);
    expect(r[0]).toMatchObject({ urgenta: "azi", cand: "azi", la: null, descriere: ["Site de prezentare"] });
  });

  it("termenul: „predare depășită cu 2 zile”, „predare azi”, „predare peste 5 zile”; închis sau livrat: nu; constructorul doar ale lui", () => {
    const depasit = proiect({ termen: "2026-11-14" });
    const azi = proiect({ termen: "2026-11-16", stadiu: "revizii" });
    const cinci = proiect({ termen: "2026-11-21" });
    const opt = proiect({ termen: "2026-11-24" });
    const inchis = proiect({ termen: "2026-11-14", inchis_la: peste(-ZI) });
    const livrat = proiect({ termen: "2026-11-14", stadiu: "livrat" });
    const d = cu((x) => {
      x.proiecte.push(depasit, azi, cinci, opt, inchis, livrat);
      x.oameniProiect.push({ proiect_id: azi.id, om_id: "r" });
    });
    const r = deTip(randuriAzi(d, ADMIN, ACUM), "termen");
    expect(r.map((x) => x.cand)).toEqual(["predare depășită cu 2 zile", "predare azi", "predare peste 5 zile"]);
    expect(r[0]).toMatchObject({ urgenta: "intarziat", nume: "Laura Ene · Atelier Ceramică", numeAscuns: true, descriere: ["Site de prezentare", "Construcție"], href: `/clienti/c1?proiect=${depasit.id}` });
    expect(r[1].urgenta).toBe("azi");
    expect(r[2].urgenta).toBe("urmeaza");
    expect(deTip(randuriAzi(d, RADU, ACUM), "termen").map((x) => x.cand)).toEqual(["predare azi"]);
  });

  it("cererea mai nouă decât cel mai nou proiect apare, doar la admin; cea mai veche nu", () => {
    const d = cu((x) => {
      x.clienti.push({ id: "c1", nume: "Laura Ene · Atelier Ceramică", lead_id: "L1" }, { id: "c2", nume: "Andreea Pop · Florăria Iris", lead_id: "L2" });
      x.proiecte.push(proiect({ client_id: "c1", creat_la: peste(-20 * ZI) }), proiect({ client_id: "c2", client: "Andreea Pop · Florăria Iris", creat_la: peste(-5 * ZI) }));
      x.cereri.push({ lead_id: "L1", primita_la: peste(-30 * ZI) }, { lead_id: "L1", primita_la: peste(-2 * H) }, { lead_id: "L2", primita_la: peste(-6 * ZI) });
    });
    const r = deTip(randuriAzi(d, ADMIN, ACUM), "cerere");
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ nume: "Laura Ene · Atelier Ceramică", urgenta: "azi", la: null, cand: "azi, 08:00", descriere: ["a trimis iar formularul"], href: "/clienti/c1" });
    expect(deTip(randuriAzi(d, RADU, ACUM), "cerere")).toHaveLength(0);
  });

  it("clientul fără niciun proiect nu primește „Cerere nouă” (ca pe pagina clientului)", () => {
    const d = cu((x) => {
      x.clienti.push({ id: "c1", nume: "Laura Ene · Atelier Ceramică", lead_id: "L1" });
      x.cereri.push({ lead_id: "L1", primita_la: peste(-2 * H) });
    });
    expect(deTip(randuriAzi(d, ADMIN, ACUM), "cerere")).toHaveLength(0);
  });

  it("livrarea trimisă acum 5 zile apare, acum 4 nu; „de refăcut”; proiect închis: nimic; constructorul doar refacerile lui", () => {
    const deschis = proiect({ id: "p1" });
    const inchis = proiect({ id: "p2", inchis_la: peste(-ZI) });
    const d = cu((x) => {
      x.proiecte.push(deschis, inchis);
      x.oameniProiect.push({ proiect_id: "p1", om_id: "r" });
      x.livrari.push(
        { id: "v5", titlu: "Previzualizarea", stare: "trimis", adaugat_la: peste(-5 * ZI), proiect_id: "p1" },
        { id: "v4", titlu: "Schița", stare: "trimis", adaugat_la: peste(-4 * ZI), proiect_id: "p1" },
        { id: "vr", titlu: "Meniul", stare: "de_refacut", adaugat_la: peste(-9 * ZI), proiect_id: "p1" },
        { id: "vi", titlu: "Logo", stare: "de_refacut", adaugat_la: peste(-9 * ZI), proiect_id: "p2" },
      );
    });
    const r = randuriAzi(d, ADMIN, ACUM);
    expect(deTip(r, "livrare_fara_raspuns")).toHaveLength(1);
    expect(deTip(r, "livrare_fara_raspuns")[0]).toMatchObject({ urgenta: "urmeaza", cand: "trimis acum 5 zile", descriere: ["Previzualizarea"], telefonNorm: "40722000222", nume: "Laura Ene · Atelier Ceramică" });
    expect(deTip(r, "livrare_refacut")).toHaveLength(1);
    expect(deTip(r, "livrare_refacut")[0]).toMatchObject({ urgenta: "azi", la: null, cand: "de refăcut", descriere: ["Meniul", "Site de prezentare"] });
    const radu = randuriAzi(d, RADU, ACUM);
    expect(deTip(radu, "livrare_refacut")).toHaveLength(1);
    expect(deTip(radu, "livrare_fara_raspuns")).toHaveLength(0);
  });
});

describe("pagina Azi: Bani", () => {
  it("rata: întârziată 5 zile; peste 7 apare, peste 8 nu; „inainte” și încasată nu apar", () => {
    const d = cu((x) =>
      x.transe.push(
        transa({ id: "t5", scadenta: "2026-11-11" }),
        transa({ id: "t0", scadenta: "2026-11-16" }),
        transa({ id: "t1", scadenta: "2026-11-17" }),
        transa({ id: "t7", scadenta: "2026-11-23" }),
        transa({ id: "t8", scadenta: "2026-11-24" }),
        transa({ id: "ti", scadenta: "2026-11-11", tip: "inainte" }),
        transa({ id: "tk", scadenta: "2026-11-11", incasata_la: "2026-11-12", incasat_lei: 1200 }),
      ),
    );
    const r = deTip(randuriAzi(d, ADMIN, ACUM), "rata");
    expect(r.map((x) => x.transa!.id)).toEqual(["t5", "t0", "t1", "t7"]);
    expect(r[0]).toMatchObject({ urgenta: "intarziat", cand: "întârzie 5 zile", nume: "Laura Ene · Atelier Ceramică", descriere: ["Rata 2 din 3"], suma: 1200, transa: { id: "t5", suma: 1200 }, tema: "bani", telefonNorm: "40722000222" });
    expect(r[1]).toMatchObject({ urgenta: "azi", cand: "azi", la: null });
    expect(r[2]).toMatchObject({ urgenta: "urmeaza", cand: "mâine" });
    expect(r[3].cand).toBe("23 nov.");
  });

  it("comisionul: un rând pe om cu totalul; poatePlati fals când e doar minus", () => {
    const d = cu((x) =>
      x.comisioane.push(
        { om_id: "r", nume: "Radu Stan", randuri: [{ tip: "comision", suma_lei: 300, platit_la: null }, { tip: "comision", suma_lei: 200, platit_la: null }, { tip: "comision", suma_lei: null, platit_la: null }] },
        { om_id: "m", nume: "Mara Ionescu", randuri: [{ tip: "minus", suma_lei: -100, platit_la: null }] },
      ),
    );
    const r = deTip(randuriAzi(d, ADMIN, ACUM), "comision");
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.comision!.omId === "r")!).toMatchObject({ nume: "Radu Stan", numeAscuns: false, suma: 500, urgenta: "cand_ai_timp", cand: "când ai timp", descriere: ["comisioane neplătite", "1 fără sumă încă"], href: "/finante", comision: { omId: "r", poatePlati: true } });
    expect(r.find((x) => x.comision!.omId === "m")!.comision!.poatePlati).toBe(false);
  });

  it("vânzarea: 29 de zile nu, 30 și 60 da, 61 nu; fără eveniment se ia creat_la; un proiect nou după livrare o scoate", () => {
    const livratLa = (zile: number, client: string, x: Partial<DateAzi["proiecte"][number]> = {}) => proiect({ client_id: client, client, stadiu: "livrat", creat_la: peste(-100 * ZI), ...x, id: `${client}-p` });
    const d = cu((x) => {
      for (const [client, zile] of [["c29", 29], ["c30", 30], ["c60", 60], ["c61", 61], ["cNou", 40]] as const) {
        x.proiecte.push(livratLa(zile, client));
        x.stadii.push({ proiect_id: `${client}-p`, la: peste(-90 * ZI), in: "constructie" }, { proiect_id: `${client}-p`, la: peste(-zile * ZI), in: "livrat" });
      }
      x.proiecte.push(proiect({ id: "cNou-p2", client_id: "cNou", client: "cNou", creat_la: peste(-10 * ZI) }));
      x.proiecte.push(livratLa(0, "cFara", { stadiu: "mentenanta", serviciu: "automatizari", creat_la: peste(-45 * ZI) }));
    });
    const r = deTip(randuriAzi(d, ADMIN, ACUM), "vanzare");
    expect(r.map((x) => x.nume).sort()).toEqual(["c30", "c60", "cFara"]);
    expect(r.find((x) => x.nume === "c30")!).toMatchObject({ descriere: ["Site livrat acum 4 săptămâni", "propune o automatizare"], urgenta: "cand_ai_timp", cand: "când ai timp", href: "/clienti/c30", numeAscuns: true });
    expect(r.find((x) => x.nume === "cFara")!.descriere).toEqual(["Automatizare livrată acum 6 săptămâni", "propune un site"]);
  });
});

describe("pagina Azi: temele rolului", () => {
  const plin = () =>
    cu((x) => {
      x.leaduri.push(lead({ caller_id: "m", closer_id: "i" }));
      x.discutii.push({ id: "d", lead_id: "l", closer_id: "i", incepe_la: peste(H), lead: { nume: "Ana", telefon_norm: null, serviciu: "site" } });
      x.taskuri.push({ id: "k", titlu: "T", om_id: "r", termen: "2026-11-16", proiect_id: "p1", proiect: "S", client_id: "c1", client: "L" });
      x.proiecte.push(proiect({ id: "p1", termen: "2026-11-16" }));
      x.oameniProiect.push({ proiect_id: "p1", om_id: "r" });
      x.transe.push(transa({}));
      x.comisioane.push({ om_id: "r", nume: "Radu Stan", randuri: [{ tip: "comision", suma_lei: 300, platit_la: null }] });
    });
  const teme = (om: { id: string; rol: Rol }) => [...new Set(randuriAzi(plin(), om, ACUM).map((x) => x.tema))].sort();

  it("callerul doar De sunat, closerul De sunat și Discuții, constructorul doar Lucru, adminul toate", () => {
    expect(teme(MARA)).toEqual(["sunat"]);
    expect(teme(VLAD)).toEqual([]);
    expect(teme(IOANA)).toEqual(["discutii", "sunat"]);
    expect(teme(RADU)).toEqual(["lucru"]);
    expect(teme(ADMIN)).toEqual(["bani", "discutii", "lucru", "sunat"]);
  });

  it("cheile sunt unice", () => {
    const r = randuriAzi(plin(), ADMIN, ACUM);
    expect(new Set(r.map((x) => x.cheie)).size).toBe(r.length);
  });
});

describe("pagina Azi: ordinea, plăcile, cifrele", () => {
  const rand = (x: Partial<RandAzi>): RandAzi => ({
    cheie: `x:${n++}`,
    tip: "task",
    tema: "lucru",
    urgenta: "azi",
    la: null,
    curand: false,
    nume: "N",
    numeAscuns: false,
    client: null,
    descriere: [],
    suma: null,
    cand: "",
    href: "/",
    telefonNorm: null,
    ...x,
  });

  it("ordinea: curând, întârziate de la cea mai veche (lead nou primul la egalitate), azi cu oră, azi fără oră, urmează, comisioane, vânzări", () => {
    const T = ACUM.getTime();
    const r = [
      rand({ cheie: "vanzare", tip: "vanzare", urgenta: "cand_ai_timp", la: T - 40 * ZI }),
      rand({ cheie: "comision-r", tip: "comision", urgenta: "cand_ai_timp", nume: "Radu Stan" }),
      rand({ cheie: "comision-m", tip: "comision", urgenta: "cand_ai_timp", nume: "Mara Ionescu" }),
      rand({ cheie: "urmeaza-2", urgenta: "urmeaza", la: T + 2 * ZI }),
      rand({ cheie: "urmeaza-1", urgenta: "urmeaza", la: T + ZI }),
      rand({ cheie: "azi-fara", urgenta: "azi", la: null }),
      rand({ cheie: "azi-16", tip: "callback", urgenta: "azi", la: T + 6 * H }),
      rand({ cheie: "azi-11", tip: "callback", urgenta: "azi", la: T + H }),
      rand({ cheie: "task-3z", urgenta: "intarziat", la: T - 3 * ZI }),
      rand({ cheie: "lead-3z", tip: "lead_nou", urgenta: "intarziat", la: T - 3 * ZI }),
      rand({ cheie: "callback-1z", tip: "callback", urgenta: "intarziat", la: T - ZI }),
      rand({ cheie: "curand", tip: "discutie", urgenta: "azi", la: T + 10 * MIN, curand: true }),
    ];
    expect(ordoneaza(r).map((x) => x.cheie)).toEqual(["curand", "lead-3z", "task-3z", "callback-1z", "azi-11", "azi-16", "azi-fara", "urmeaza-1", "urmeaza-2", "comision-m", "comision-r", "vanzare"]);
  });

  it("urmatorul: după ultimul revine la primul; de la null e al doilea; cu un singur rând nu există", () => {
    const r = [rand({ cheie: "a" }), rand({ cheie: "b" }), rand({ cheie: "c" })];
    expect(urmatorul(r, "a")).toBe("b");
    expect(urmatorul(r, "c")).toBe("a");
    expect(urmatorul(r, null)).toBe("b");
    expect(urmatorul(r, "nu-mai-e")).toBe("b");
    expect(urmatorul([rand({ cheie: "a" })], "a")).toBeNull();
    expect(urmatorul([], null)).toBeNull();
  });

  it("plăcile: doar temele cu rânduri, în ordine; întârziatele întâi; rezumatele", () => {
    const p = placi([
      rand({ tema: "bani", tip: "rata", urgenta: "urmeaza" }),
      rand({ tema: "bani", tip: "comision", urgenta: "cand_ai_timp" }),
      rand({ tema: "sunat", tip: "lead_nou" }),
      rand({ tema: "sunat", tip: "lead_nou" }),
      rand({ tema: "sunat", tip: "lead_nou" }),
      rand({ tema: "sunat", tip: "callback" }),
      rand({ tema: "sunat", tip: "callback" }),
      rand({ tema: "discutii", tip: "discutie", urgenta: "azi" }),
      rand({ tema: "discutii", tip: "discutie", urgenta: "urmeaza" }),
    ]);
    expect(p).toEqual([
      { tema: "sunat", nume: "De sunat", total: 5, intarziate: 0, rezumat: "3 noi · 2 callback" },
      { tema: "discutii", nume: "Discuții", total: 2, intarziate: 0, rezumat: "1 azi" },
      { tema: "bani", nume: "Bani", total: 2, intarziate: 0, rezumat: "1 rată · 1 comision" },
    ]);
    expect(placi([rand({ tema: "discutii", tip: "discutie", urgenta: "urmeaza" })])[0].rezumat).toBe("1 mâine");
    expect(placi([rand({ urgenta: "intarziat" }), rand({ urgenta: "intarziat" }), rand({})])[0]).toMatchObject({ intarziate: 2, rezumat: "2 întârziate" });
    expect(placi([rand({ urgenta: "intarziat" })])[0].rezumat).toBe("1 întârziată");
    expect(placi([...Array(20)].map(() => rand({})).concat(rand({ tip: "termen" })))[0].rezumat).toBe("20 de task-uri · 1 alta");
    expect(placi([rand({ tema: "sunat", tip: "lead_nou" })])[0].rezumat).toBe("1 nou");
  });

  it("cifrele de sus: fără cele cu 0; singular și plural", () => {
    expect(
      cifreSus([
        rand({ tema: "sunat", tip: "lead_nou", urgenta: "intarziat" }),
        rand({ tema: "sunat", tip: "callback" }),
        rand({ tema: "discutii", tip: "discutie", urgenta: "azi" }),
        rand({ tema: "discutii", tip: "discutie", urgenta: "urmeaza" }),
        rand({ tip: "task", urgenta: "intarziat" }),
        rand({ tip: "task", urgenta: "azi" }),
        rand({ tip: "task", urgenta: "azi" }),
        rand({ tema: "bani", tip: "rata", urgenta: "urmeaza" }),
        rand({ tema: "bani", tip: "rata", urgenta: "intarziat" }),
        rand({ tema: "bani", tip: "rata", urgenta: "azi" }),
      ]),
    ).toEqual([
      { text: "3 întârziate", culoare: "red" },
      { text: "2 de sunat", culoare: "amber" },
      { text: "1 discuție azi", culoare: "blue" },
      { text: "2 task-uri azi", culoare: "violet" },
      { text: "3 rate de încasat", culoare: "green" },
    ]);
    expect(cifreSus([rand({ urgenta: "intarziat" })])).toEqual([{ text: "1 întârziată", culoare: "red" }]);
    expect(cifreSus([])).toEqual([]);
  });

  it("salutul după ora României, iarna și vara", () => {
    expect(salut(new Date("2026-11-16T09:59:00Z"))).toBe("Bună dimineața");
    expect(salut(new Date("2026-11-16T10:00:00Z"))).toBe("Bună ziua");
    expect(salut(new Date("2026-11-16T16:00:00Z"))).toBe("Bună seara");
    expect(salut(new Date("2026-07-16T08:59:00Z"))).toBe("Bună dimineața");
    expect(salut(new Date("2026-07-16T09:00:00Z"))).toBe("Bună ziua");
    expect(salut(new Date("2026-07-16T15:00:00Z"))).toBe("Bună seara");
  });

  it("ziTitlu: „Luni, 16 noiembrie”, după ziua României", () => {
    expect(ziTitlu(ACUM)).toBe("Luni, 16 noiembrie");
    expect(ziTitlu(new Date("2026-11-16T22:30:00Z"))).toBe("Marți, 17 noiembrie");
  });
});
