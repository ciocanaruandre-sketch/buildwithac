import "server-only";
import { TEME_ROL, type DateAzi } from "@/lib/azi";
import type { Eu } from "@/lib/eu";
import type { ComisionOm, Transa } from "@/lib/finante";
import { supabase } from "@/lib/supabase/server";
import { laOraRomaniei, ziuaPeste } from "@/lib/timp";
import type { Stadiu } from "@/lib/tipuri";

const ZI = 86_400_000;
const nimic = Promise.resolve({ data: null });

/**
 * Ce are de citit pagina „Azi” pentru omul conectat, cu clientul lui (RLS-ul păzește banii și proiectele).
 * Temele pe care rolul nu le vede nici nu se cer. Toate cererile pleacă odată.
 */
export async function citesteAzi(om: Eu, acum: Date): Promise<DateAzi> {
  const db = await supabase();
  const teme = TEME_ROL[om.rol];
  const admin = om.rol === "admin";
  const pana7 = ziuaPeste(acum, 7);
  const poimaine = laOraRomaniei(ziuaPeste(acum, 2), "00:00").toISOString();
  const sunat = teme.includes("sunat");
  const lucru = teme.includes("lucru");
  const bani = teme.includes("bani");

  const [leaduri, discutii, taskuri, proiecte, oameniProiect, stadii, cereri, clienti, livrari, transe, comisioane, oameni] = await Promise.all([
    sunat ? db.from("lead_uri").select("id, nume, telefon_norm, serviciu, sursa, stare, intrat_la, callback_la, caller_id, closer_id").in("stare", ["nou", "callback"]) : nimic,
    teme.includes("discutii")
      ? db
          .from("discutii")
          .select("id, lead_id, closer_id, incepe_la, lead_uri (nume, telefon_norm, serviciu)")
          .gte("incepe_la", new Date(acum.getTime() - 15 * 60_000).toISOString())
          .lt("incepe_la", poimaine)
      : nimic,
    lucru ? db.from("taskuri").select("id, titlu, om_id, termen, proiect_id, proiecte (titlu, client_id, clienti (nume))").eq("gata", false).not("termen", "is", null).lte("termen", pana7) : nimic,
    lucru || bani ? db.from("proiecte").select("id, titlu, client_id, serviciu, stadiu, termen, inchis_la, creat_la, clienti (nume, telefon)") : nimic,
    lucru && !admin ? db.from("proiect_oameni").select("proiect_id, om_id").eq("om_id", om.id) : nimic,
    // pentru a doua vânzare ajung evenimentele din ultimele 62 de zile
    bani ? db.from("evenimente_proiect").select("proiect_id, la, detalii").eq("tip", "stadiu").gte("la", new Date(acum.getTime() - 62 * ZI).toISOString()) : nimic,
    admin ? db.from("cereri").select("lead_id, primita_la, lead_uri!inner (stare)").eq("lead_uri.stare", "client") : nimic,
    admin ? db.from("clienti").select("id, nume, lead_id") : nimic,
    lucru ? db.from("livrari").select("id, titlu, stare, adaugat_la, proiect_id").in("stare", ["trimis", "de_refacut"]) : nimic,
    bani ? db.from("transe").select("*, proiecte (client_id, clienti (nume, telefon))").is("incasata_la", null).neq("tip", "inainte").lte("scadenta", pana7) : nimic,
    bani ? db.from("comisioane").select("om_id, tip, suma_lei, platit_la").is("platit_la", null) : nimic,
    db.from("profiluri").select("id, nume"),
  ]);

  const numeOm = new Map((oameni.data ?? []).map((o) => [o.id, o.nume]));
  const peOm = new Map<string, ComisionOm[]>();
  for (const k of comisioane.data ?? []) peOm.set(k.om_id, [...(peOm.get(k.om_id) ?? []), k]);

  return {
    leaduri: leaduri.data ?? [],
    discutii: (discutii.data ?? []).flatMap((x) => (x.lead_uri ? [{ id: x.id, lead_id: x.lead_id, closer_id: x.closer_id, incepe_la: x.incepe_la, lead: x.lead_uri }] : [])),
    taskuri: (taskuri.data ?? []).map((k) => ({ id: k.id, titlu: k.titlu, om_id: k.om_id, termen: k.termen, proiect_id: k.proiect_id, proiect: k.proiecte.titlu, client_id: k.proiecte.client_id, client: k.proiecte.clienti.nume })),
    proiecte: (proiecte.data ?? []).map(({ clienti: c, ...p }) => ({ ...p, client: c.nume, telefon: c.telefon })),
    oameniProiect: oameniProiect.data ?? [],
    stadii: (stadii.data ?? []).map((e) => ({ proiect_id: e.proiect_id, la: e.la, in: (e.detalii as { in?: Stadiu }).in ?? "discutie" })),
    cereri: (cereri.data ?? []).map((c) => ({ lead_id: c.lead_id, primita_la: c.primita_la })),
    clienti: clienti.data ?? [],
    livrari: livrari.data ?? [],
    transe: (transe.data ?? []).map(({ proiecte: p, ...t }) => ({ ...(t as Transa), client_id: p?.client_id ?? "", client: p?.clienti?.nume ?? "client șters", telefon: p?.clienti?.telefon ?? null })),
    comisioane: [...peOm].map(([om_id, randuri]) => ({ om_id, nume: numeOm.get(om_id) ?? "cineva", randuri })),
    oameni: oameni.data ?? [],
  };
}
