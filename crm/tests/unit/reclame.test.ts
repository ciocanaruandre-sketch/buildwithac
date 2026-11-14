import { describe, expect, it } from "vitest";
import { castig, ordoneaza, reclamaDinUtm, sursaDinUtm, TEXT_META, TEXT_TIKTOK, totaluri, verdict, type CifreReclama } from "@/lib/reclame";

const reclama = (platforma: string, x: Record<string, string> = {}) => ({ utm_source: platforma, utm_medium: "reclama", utm_campaign: "Site-uri pentru cafenele", utm_content: "Clip cafenea", ...x });

describe("reclamaDinUtm / sursaDinUtm", () => {
  it("Meta din reclamă", () => {
    expect(reclamaDinUtm(reclama("ig"))).toEqual({ platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Clip cafenea" });
    expect(sursaDinUtm(reclama("ig"))).toBe("reclama_meta");
    for (const s of ["fb", "Facebook", "INSTAGRAM", "msg", "messenger", "an", "th", "meta"]) expect(sursaDinUtm(reclama(s))).toBe("reclama_meta");
  });

  it("TikTok din reclamă", () => {
    expect(reclamaDinUtm(reclama("tiktok"))?.platforma).toBe("tiktok");
    expect(sursaDinUtm(reclama("TikTok"))).toBe("reclama_tiktok");
  });

  it("utm_medium se compară fără majuscule", () => {
    expect(sursaDinUtm(reclama("fb", { utm_medium: "Reclama" }))).toBe("reclama_meta");
  });

  it("link organic din bio nu e reclamă", () => {
    const utm = { utm_source: "instagram", utm_campaign: "bio" };
    expect(reclamaDinUtm(utm)).toBeNull();
    expect(sursaDinUtm(utm)).toBe("formular_site");
  });

  it("fără campanie și fără nume nu e reclamă", () => {
    expect(reclamaDinUtm({ utm_source: "fb", utm_medium: "reclama" })).toBeNull();
    expect(reclamaDinUtm({ utm_source: "fb", utm_medium: "reclama", utm_campaign: "  ", utm_content: " " })).toBeNull();
  });

  it("platformă necunoscută nu e reclamă", () => {
    expect(reclamaDinUtm(reclama("google"))).toBeNull();
    expect(sursaDinUtm(reclama("google"))).toBe("formular_site");
    expect(sursaDinUtm({})).toBe("formular_site");
  });

  it("numele lung se taie la 120, spațiile de la capete dispar", () => {
    expect(reclamaDinUtm(reclama("fb", { utm_content: "  " + "ă".repeat(150) + " " }))?.nume).toBe("ă".repeat(120));
    const emoji = "🔥".repeat(130);
    const a = reclamaDinUtm(reclama("fb", { utm_content: emoji }))!.nume;
    expect(Array.from(a)).toHaveLength(120);
    expect(a).toBe("🔥".repeat(120));
    expect(reclamaDinUtm(reclama("fb", { utm_content: emoji }))!.nume).toBe(a);
  });

  it("fără utm_content, numele e campania", () => {
    expect(reclamaDinUtm(reclama("fb", { utm_content: "" }))).toEqual({ platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Site-uri pentru cafenele" });
  });

  it("textele pentru Ads Manager au semnul de reclamă", () => {
    expect(TEXT_META).toContain("utm_medium=reclama");
    expect(TEXT_META).toContain("{{ad.name}}");
    expect(TEXT_TIKTOK).toContain("utm_medium=reclama");
    expect(TEXT_TIKTOK).toContain("__CID_NAME__");
  });
});

const MACHETA: CifreReclama[] = [
  { id: "1", platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Clip cafenea, înainte și după", cheltuit_lei: 620, lead_uri: 14, discutii: 6, clienti: 2, incasat_lei: 4500, mai_vin_lei: 2000 },
  { id: "2", platforma: "meta", campanie: "Site-uri pentru cafenele", nume: "Carusel: 5 greșeli pe site", cheltuit_lei: 380, lead_uri: 9, discutii: 2, clienti: 0, incasat_lei: 0, mai_vin_lei: 0 },
  { id: "3", platforma: "meta", campanie: "Automatizări pentru saloane", nume: "Clip programări pe WhatsApp", cheltuit_lei: 450, lead_uri: 7, discutii: 4, clienti: 2, incasat_lei: 3200, mai_vin_lei: 800 },
  { id: "4", platforma: "meta", campanie: "Automatizări pentru saloane", nume: "Poză: recenzii Google", cheltuit_lei: null, lead_uri: 3, discutii: 1, clienti: 0, incasat_lei: 0, mai_vin_lei: 0 },
  { id: "5", platforma: "tiktok", campanie: "Site în 7 zile", nume: "Clip ecran de telefon", cheltuit_lei: 300, lead_uri: 11, discutii: 3, clienti: 1, incasat_lei: 1500, mai_vin_lei: 1500 },
];
const r = (x: Partial<CifreReclama>): CifreReclama => ({ ...MACHETA[0], ...x });

describe("verdict", () => {
  it("aduce bani", () => {
    expect(verdict(MACHETA[0])).toEqual({ ton: "green", text: "Aduce bani: la 1 leu cheltuit ai încasat 7,3 lei." });
  });
  it("niciun client", () => {
    expect(verdict(MACHETA[1])).toEqual({ ton: "red", text: "Niciun client încă. 9 lead-uri, 42 lei fiecare." });
    expect(verdict(r({ lead_uri: 0, clienti: 0, incasat_lei: 0 }))).toEqual({ ton: "red", text: "Niciun lead încă." });
    expect(verdict(r({ lead_uri: 1, clienti: 0, incasat_lei: 0, cheltuit_lei: 40 }))).toEqual({ ton: "red", text: "Niciun client încă. 1 lead, 40 lei." });
    expect(verdict(r({ lead_uri: 20, clienti: 0, incasat_lei: 0, cheltuit_lei: 400 }))).toEqual({ ton: "red", text: "Niciun client încă. 20 de lead-uri, 20 lei fiecare." });
  });
  it("fără sumă", () => {
    expect(verdict(MACHETA[3])).toEqual({ ton: "amber", text: "Scrie cât ai cheltuit ca să vezi dacă merită." });
  });
  it("pe minus, dar mai vin bani", () => {
    expect(verdict(r({ cheltuit_lei: 2000, incasat_lei: 1500, mai_vin_lei: 1500 }))).toEqual({ ton: "amber", text: "Încă pe minus, dar mai vin 1.500 lei." });
    expect(verdict(r({ cheltuit_lei: 2000, incasat_lei: 1500, mai_vin_lei: 0 }))).toEqual({ ton: "red", text: "Pe minus: 500 lei." });
  });
  it("cheltuială zero", () => {
    expect(verdict(r({ cheltuit_lei: 0 }))).toEqual({ ton: "green", text: "Aduce bani fără cheltuială." });
  });
});

describe("ordoneaza și totaluri", () => {
  it("după câștig, cele fără sumă la final", () => {
    expect(ordoneaza(MACHETA).map(castig)).toEqual([3880, 2750, 1200, -380, null]);
  });
  it("cele fără sumă, după lead-uri", () => {
    const a = r({ id: "a", cheltuit_lei: null, lead_uri: 2 });
    const b = r({ id: "b", cheltuit_lei: null, lead_uri: 5 });
    expect(ordoneaza([a, b]).map((x) => x.id)).toEqual(["b", "a"]);
  });
  it("totalurile machetei", () => {
    const t = totaluri(MACHETA);
    expect(t).toMatchObject({ cheltuit: 1750, lead_uri: 44, clienti: 5, incasat: 9200, mai_vin: 4300, reclame: 5 });
    expect(t.peClient).toBe(350);
    // reclama fără sumă (3 lead-uri) nu intră în costul pe lead
    expect(t.peLead).toBeCloseTo(1750 / 41);
  });
  it("costul pe lead și pe client, doar din reclamele cu sumă", () => {
    const t = totaluri([r({ cheltuit_lei: 100, lead_uri: 2, clienti: 1 }), r({ id: "b", cheltuit_lei: null, lead_uri: 8, clienti: 3 })]);
    expect(t).toMatchObject({ cheltuit: 100, lead_uri: 10, clienti: 4, peLead: 50, peClient: 100 });
    expect(totaluri([r({ cheltuit_lei: null, lead_uri: 5 })])).toMatchObject({ peLead: null, peClient: null });
  });
  it("fără reclame, totalurile sunt zero", () => {
    expect(totaluri([])).toMatchObject({ cheltuit: 0, lead_uri: 0, peLead: null, peClient: null });
  });
});
