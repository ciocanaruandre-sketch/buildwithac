import { lei } from "@/lib/proiecte";

export type Platforma = "meta" | "tiktok";
export type ReclamaUtm = { platforma: Platforma; campanie: string; nume: string };

/** = rândurile din `reclame_cifre()` (baza de date). */
export type CifreReclama = {
  id: string;
  platforma: Platforma;
  campanie: string;
  nume: string;
  cheltuit_lei: number | null;
  lead_uri: number;
  discutii: number;
  clienti: number;
  incasat_lei: number;
  mai_vin_lei: number;
};

/** Ce poate pune Meta în `{{site_source_name}}` (Facebook, Instagram, Messenger, Audience Network, Threads). */
const SURSE_META = ["fb", "ig", "facebook", "instagram", "msg", "messenger", "an", "th", "meta"];

/** Textul de lipit o dată în Ads Manager, la parametrii URL ai reclamei. Platforma pune singură numele campaniei și al reclamei. */
export const TEXT_META = "utm_source={{site_source_name}}&utm_medium=reclama&utm_campaign={{campaign.name}}&utm_content={{ad.name}}";
export const TEXT_TIKTOK = "utm_source=tiktok&utm_medium=reclama&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__";

/** Spațiile de la capete scoase, cel mult 120 de caractere (întregi: un emoji nu se rupe). La fel ca limita din baza de date. */
const taie = (s: string | undefined) => Array.from((s ?? "").trim()).slice(0, 120).join("");

function platforma(sursa: string | undefined): Platforma | null {
  const s = (sursa ?? "").trim().toLowerCase();
  if (SURSE_META.includes(s)) return "meta";
  if (s === "tiktok") return "tiktok";
  return null;
}

/**
 * Reclama din link. E reclamă doar cu `utm_medium=reclama` și o campanie sau un nume:
 * un link din bio cu `utm_source=instagram` nu e reclamă.
 */
export function reclamaDinUtm(utm: Record<string, string>): ReclamaUtm | null {
  if ((utm.utm_medium ?? "").trim().toLowerCase() !== "reclama") return null;
  const p = platforma(utm.utm_source);
  const campanie = taie(utm.utm_campaign);
  const nume = taie(utm.utm_content) || campanie;
  if (!p || !nume) return null;
  return { platforma: p, campanie, nume };
}

export function sursaDinUtm(utm: Record<string, string>): "reclama_meta" | "reclama_tiktok" | "formular_site" {
  const r = reclamaDinUtm(utm);
  if (!r) return "formular_site";
  return r.platforma === "meta" ? "reclama_meta" : "reclama_tiktok";
}

/** Încasat − cheltuit; `null` cât nu e scrisă suma. */
export const castig = (r: CifreReclama): number | null => (r.cheltuit_lei === null ? null : r.incasat_lei - r.cheltuit_lei);
export const peLead = (r: CifreReclama): number | null => (r.cheltuit_lei === null || !r.lead_uri ? null : r.cheltuit_lei / r.lead_uri);
export const peClient = (r: CifreReclama): number | null => (r.cheltuit_lei === null || !r.clienti ? null : r.cheltuit_lei / r.clienti);

export type Verdict = { ton: "green" | "red" | "amber"; text: string };

/** Propoziția de jos de pe card. */
export function verdict(r: CifreReclama): Verdict {
  if (r.cheltuit_lei === null) return { ton: "amber", text: "Scrie cât ai cheltuit ca să vezi dacă merită." };
  if (!r.clienti) {
    if (!r.lead_uri) return { ton: "red", text: "Niciun lead încă." };
    return { ton: "red", text: `Niciun client încă. ${r.lead_uri} lead-uri, ${lei(peLead(r))} fiecare.` };
  }
  const c = castig(r)!;
  if (c >= 0) {
    if (r.cheltuit_lei === 0) return { ton: "green", text: "Aduce bani fără cheltuială." };
    const raport = (r.incasat_lei / r.cheltuit_lei).toFixed(1).replace(".", ",");
    return { ton: "green", text: `Aduce bani: la 1 leu cheltuit ai încasat ${raport} lei.` };
  }
  if (r.mai_vin_lei > 0) return { ton: "amber", text: `Încă pe minus, dar mai vin ${lei(r.mai_vin_lei)}.` };
  return { ton: "red", text: `Pe minus: ${lei(-c)}.` };
}

/** Întâi cele cu sumă, după câștig; la final cele fără sumă, după lead-uri. */
export function ordoneaza(r: CifreReclama[]): CifreReclama[] {
  return [...r].sort((a, b) => {
    const ca = castig(a);
    const cb = castig(b);
    if (ca === null && cb === null) return b.lead_uri - a.lead_uri;
    if (ca === null) return 1;
    if (cb === null) return -1;
    return cb - ca;
  });
}

export type Totaluri = { cheltuit: number; lead_uri: number; clienti: number; incasat: number; mai_vin: number; reclame: number; peLead: number | null; peClient: number | null };

export function totaluri(r: CifreReclama[]): Totaluri {
  const s = (f: (x: CifreReclama) => number) => r.reduce((a, x) => a + f(x), 0);
  const cheltuit = s((x) => x.cheltuit_lei ?? 0);
  const lead_uri = s((x) => x.lead_uri);
  const clienti = s((x) => x.clienti);
  return {
    cheltuit,
    lead_uri,
    clienti,
    incasat: s((x) => x.incasat_lei),
    mai_vin: s((x) => x.mai_vin_lei),
    reclame: r.length,
    peLead: lead_uri ? cheltuit / lead_uri : null,
    peClient: clienti ? cheltuit / clienti : null,
  };
}
