import { describe, expect, it } from "vitest";
import { CRM } from "@/lib/config";
import { clientiDeSters, construiesteCopia, dataLimita, eLuni, ZILE_DUPA_COLABORARE, ZILE_PASTRARE, ziuaAnonimizarii } from "@/lib/retentie";

describe("clienții cu colaborarea încheiată", () => {
  const acum = new Date("2027-12-01T04:00:00Z");
  const zile = (n: number) => new Date(acum.getTime() - n * 86_400_000).toISOString();

  it("un an după ultimul proiect, cum promite pagina de confidențialitate", () => {
    expect(ZILE_DUPA_COLABORARE).toBe(365);
  });
  it("toate proiectele închise de peste un an → de șters", () => {
    expect(clientiDeSters([{ client_id: "a", inchis_la: zile(366) }], acum)).toEqual(["a"]);
    expect(clientiDeSters([{ client_id: "a", inchis_la: zile(900) }, { client_id: "a", inchis_la: zile(400) }], acum)).toEqual(["a"]);
  });
  it("închis de mai puțin de un an → rămâne", () => {
    expect(clientiDeSters([{ client_id: "a", inchis_la: zile(364) }], acum)).toEqual([]);
  });
  it("un proiect deschis ține clientul, oricât de vechi e celălalt", () => {
    expect(clientiDeSters([{ client_id: "a", inchis_la: zile(900) }, { client_id: "a", inchis_la: null }], acum)).toEqual([]);
  });
  it("anul se numără de la ultimul proiect închis", () => {
    expect(clientiDeSters([{ client_id: "a", inchis_la: zile(900) }, { client_id: "a", inchis_la: zile(10) }], acum)).toEqual([]);
  });
  it("fiecare client e judecat separat", () => {
    const p = [{ client_id: "a", inchis_la: zile(500) }, { client_id: "b", inchis_la: null }, { client_id: "c", inchis_la: zile(366) }];
    expect(clientiDeSters(p, acum).sort()).toEqual(["a", "c"]);
  });
  it("e-mailul de luni îi arată, cu link la fișă; fără ei, paragraful lipsește", () => {
    const e = construiesteCopia({}, acum, 0, [], [{ id: "c1", nume: "Cafeneaua <Colț>" }]);
    expect(e.text).toContain("Clienți cu colaborarea încheiată de peste un an (1)");
    expect(e.text).toContain(`${CRM.url}/clienti/c1`);
    expect(e.html).toContain(`<a href="${CRM.url}/clienti/c1">Cafeneaua &lt;Colț&gt;</a>`);
    expect(construiesteCopia({}, acum, 0).text).not.toContain("colaborarea încheiată");
  });
});

describe("retenția", () => {
  it("se păstrează un an", () => {
    expect(ZILE_PASTRARE).toBe(365);
  });

  it("dataLimita = acum − 365 de zile", () => {
    expect(dataLimita(new Date("2026-11-10T04:00:00Z")).toISOString()).toBe("2025-11-10T04:00:00.000Z");
  });

  it("ziuaAnonimizarii: prima rulare a jobului (04:00 UTC) după un an", () => {
    expect(ziuaAnonimizarii("2025-11-12T10:00:00Z")).toBe("2026-11-13");
    expect(ziuaAnonimizarii("2025-11-12T03:00:00Z")).toBe("2026-11-12");
  });

  it("eLuni se uită la ora României", () => {
    expect(eLuni(new Date("2026-11-09T22:30:00Z"))).toBe(false); // marți 00:30 în România
    expect(eLuni(new Date("2026-11-09T04:00:00Z"))).toBe(true); // luni 06:00
    expect(eLuni(new Date("2026-11-08T22:30:00Z"))).toBe(true); // luni 00:30 (duminică în UTC)
  });
});

describe("construiesteCopia", () => {
  const tabele = { lead_uri: [{ id: "a", nume: "Ion" }], cereri: [] };

  it("atașamentul crm-<data>.json, cu toate tabelele", () => {
    const e = construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 0);
    expect(e.subiect).toBe("Copia CRM-ului, 2026-11-09");
    expect(e.atasamente?.[0].nume).toBe("crm-2026-11-09.json");
    const json = JSON.parse(Buffer.from(e.atasamente![0].continut, "base64").toString("utf8"));
    expect(json.tabele).toEqual(tabele);
    expect(e.text).not.toContain("șters");
  });

  it("spune din câte lead-uri a scos datele personale, dacă a scos", () => {
    expect(construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 1).text).toContain("Am scos datele personale din 1 lead mai vechi de un an");
    expect(construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 2).text).toContain(
      "Am scos datele personale din 2 lead-uri mai vechi de un an, cum promite pagina de confidențialitate.",
    );
  });

  it("arată lead-urile care rămân fără nume în următoarele 7 zile, cu link la fișă", () => {
    const acum = new Date("2026-11-09T04:00:00Z");
    const expira = [{ id: "abc", nume: "Ion <Pop>", stare: "oferta_trimisa" as const, intrat_la: "2025-11-12T10:00:00Z" }];
    const e = construiesteCopia(tabele, acum, 0, expira);
    expect(e.text).toContain("Rămân fără nume în următoarele 7 zile (1). Dacă vreunul e încă în lucru, cere-i o confirmare nouă:");
    expect(e.text).toContain("Ion <Pop> · Ofertă trimisă · rămâne fără nume pe 2026-11-13");
    expect(e.text).toContain("https://crm.buildwithac.ro/lead-uri/abc");
    expect(e.html).toContain("Ion &lt;Pop&gt;");
    expect(construiesteCopia(tabele, acum, 0, []).text).not.toContain("Rămân fără nume");
  });

  it("fără ş/ţ cu sedilă", () => {
    const e = construiesteCopia(tabele, new Date("2026-11-09T04:00:00Z"), 2);
    expect(e.subiect + e.text).not.toMatch(/[şţŞŢ]/);
  });
});
