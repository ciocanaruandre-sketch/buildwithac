import { describe, expect, it } from "vitest";
import { descrieEvenimentProiect, type Eveniment } from "@/lib/parcurs";
import { citesteLei, citesteProcent, grupeazaTaskuri, lei, ordoneazaTaskuri, progres, textIntarziere, urmatorulTask, zileIntarziere, type TaskScurt } from "@/lib/proiecte";

let n = 0;
const t = (x: Partial<TaskScurt>): TaskScurt => ({ id: String(++n), titlu: "t", om_id: null, termen: null, gata: false, gata_la: null, creat_la: "2026-11-01T10:00:00Z", ...x });

describe("progres", () => {
  it("fără task-uri e zero, nu împărțire la zero", () => {
    expect(progres([])).toEqual({ gata: 0, total: 0, procent: 0 });
  });
  it("numără cele gata și rotunjește procentul", () => {
    expect(progres([t({ gata: true }), t({}), t({})])).toEqual({ gata: 1, total: 3, procent: 33 });
    expect(progres([t({ gata: true }), t({ gata: true })])).toEqual({ gata: 2, total: 2, procent: 100 });
  });
});

describe("zileIntarziere", () => {
  it("termenul de azi nu e întârziat", () => {
    expect(zileIntarziere("2026-11-10", "2026-11-10")).toBe(0);
  });
  it("numără zilele trecute", () => {
    expect(zileIntarziere("2026-11-07", "2026-11-10")).toBe(3);
    expect(zileIntarziere("2026-11-09", "2026-11-10")).toBe(1);
  });
  it("peste schimbarea orei (25 oct. 2026) nu pierde și nu câștigă o zi", () => {
    expect(zileIntarziere("2026-10-24", "2026-10-26")).toBe(2);
    expect(zileIntarziere("2027-03-27", "2027-03-29")).toBe(2);
  });
  it("fără termen sau cu termen în viitor: 0", () => {
    expect(zileIntarziere(null, "2026-11-10")).toBe(0);
    expect(zileIntarziere("2026-11-12", "2026-11-10")).toBe(0);
  });
});

describe("ordinea task-urilor", () => {
  const a = t({ titlu: "7 nov", termen: "2026-11-07" });
  const b = t({ titlu: "13 nov", termen: "2026-11-13" });
  const c = t({ titlu: "fără termen, vechi", creat_la: "2026-10-01T10:00:00Z" });
  const d = t({ titlu: "fără termen, nou", creat_la: "2026-11-05T10:00:00Z" });
  const e = t({ titlu: "gata demult", gata: true, gata_la: "2026-10-20T10:00:00Z", termen: "2026-10-01" });
  const f = t({ titlu: "gata ieri", gata: true, gata_la: "2026-11-09T10:00:00Z" });

  it("negata întâi (termen crescător, fără termen la urmă, apoi după creare); cele gata la sfârșit, recentele sus", () => {
    expect(ordoneazaTaskuri([f, d, e, b, c, a]).map((x) => x.titlu)).toEqual(["7 nov", "13 nov", "fără termen, vechi", "fără termen, nou", "gata ieri", "gata demult"]);
  });
  it("nu schimbă lista primită", () => {
    const lista = [b, a];
    ordoneazaTaskuri(lista);
    expect(lista).toEqual([b, a]);
  });
  it("următorul task e primul negata; null când toate sunt gata sau nu e niciunul", () => {
    expect(urmatorulTask([f, b, a, c])?.titlu).toBe("7 nov");
    expect(urmatorulTask([c, e])?.titlu).toBe("fără termen, vechi");
    expect(urmatorulTask([e, f])).toBeNull();
    expect(urmatorulTask([])).toBeNull();
  });
  it("grupele din „Task-urile mele”: doar cele negata, fiecare în grupa lui", () => {
    const azi = t({ titlu: "azi", termen: "2026-11-10" });
    const g = grupeazaTaskuri([f, d, e, b, azi, c, a], "2026-11-10");
    expect(g.intarziate.map((x) => x.titlu)).toEqual(["7 nov"]);
    expect(g.azi.map((x) => x.titlu)).toEqual(["azi"]);
    expect(g.urmeaza.map((x) => x.titlu)).toEqual(["13 nov"]);
    expect(g.faraTermen.map((x) => x.titlu)).toEqual(["fără termen, vechi", "fără termen, nou"]);
  });
});

describe("banii", () => {
  it("lei: punct la mii, „—” când lipsește", () => {
    expect(lei(2400)).toBe("2.400 lei");
    expect(lei(1250000)).toBe("1.250.000 lei");
    expect(lei(0)).toBe("0 lei");
    expect(lei(null)).toBe("—");
  });
});

describe("ce scrie omul în formular", () => {
  it("citesteLei: întregi, cu sau fără punct și spații; gol = fără sumă", () => {
    expect(citesteLei("2400")).toBe(2400);
    expect(citesteLei("2.400")).toBe(2400);
    expect(citesteLei(" 2 400 ")).toBe(2400);
    expect(citesteLei("0")).toBe(0);
    expect(citesteLei("")).toBeNull();
    expect(citesteLei("   ")).toBeNull();
  });
  it("citesteLei: orice altceva e greșit", () => {
    for (const s of ["abc", "-5", "12,50", "1e3", "10000001", "2400 lei"]) expect(citesteLei(s), s).toBe("gresit");
  });
  it("citesteProcent: între 0 și 100, cu virgulă sau punct; gol = nestabilit", () => {
    expect(citesteProcent("30")).toBe(30);
    expect(citesteProcent("33,5")).toBe(33.5);
    expect(citesteProcent("33.33")).toBe(33.33);
    expect(citesteProcent(" 30% ")).toBe(30);
    expect(citesteProcent("")).toBeNull();
    for (const s of ["101", "-1", "abc", "33,333"]) expect(citesteProcent(s), s).toBe("gresit");
  });
  it("textIntarziere: o zi, câteva zile, „de zile” de la 20", () => {
    expect(textIntarziere(0)).toBe("");
    expect(textIntarziere(1)).toBe("întârziat o zi");
    expect(textIntarziere(3)).toBe("întârziat 3 zile");
    expect(textIntarziere(19)).toBe("întârziat 19 zile");
    expect(textIntarziere(20)).toBe("întârziat 20 de zile");
    expect(textIntarziere(101)).toBe("întârziat 101 zile");
    expect(textIntarziere(120)).toBe("întârziat 120 de zile");
  });
});

describe("descrieEvenimentProiect", () => {
  const nume = (id: unknown) => (id === "m" ? "Mihai" : "cineva");
  const e = (tip: string, detalii: Record<string, unknown> = {}): Eveniment => ({ tip, detalii, la: "2026-11-03T08:15:00Z", autor_id: null });

  it.each([
    [e("proiect_creat", { titlu: "Site", serviciu: "site" }), "Proiect nou: Site"],
    [e("stadiu", { de: "schita", in: "constructie" }), "Stadiu: Schiță → Construcție"],
    [e("om_adaugat", { om: "m" }), "Mihai adăugat în proiect"],
    [e("om_scos", { om: "m" }), "Mihai scos din proiect"],
    [e("inchis"), "Proiect închis"],
    [e("redeschis"), "Proiect redeschis"],
    [e("livrat", { titlu: "Schița (v2)" }), "Trimis clientului: Schița (v2)"],
    [e("livrare_stare", { titlu: "Schița (v2)", in: "aprobat" }), "Schița (v2): Aprobat"],
    [e("livrare_stare", { titlu: "Schița (v2)", in: "de_refacut" }), "Schița (v2): De refăcut"],
    [e("altceva_nou"), "altceva_nou"],
  ])("%#: %o", (ev, text) => {
    expect(descrieEvenimentProiect(ev, nume)).toBe(text);
  });
});
