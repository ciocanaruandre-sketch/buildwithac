import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/baza.types";
import { ECHIPA_TEST, type ContTest } from "../../lib/echipa-test";

type LeadNou = Database["public"]["Tables"]["lead_uri"]["Insert"];

/** Clientul cu cheia de serviciu, pentru pregătirea datelor din testele e2e (proiectul de test). */
export const db = () =>
  createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

let n = 0;
/** Un lead nou, cu telefon unic 0799…, șters de `stergeLead` la final. */
export async function leadNou(camp: Partial<LeadNou> = {}) {
  const sufix = `${Date.now().toString().slice(-5)}${n++ % 10}`;
  const telefon_norm = `40799${sufix}`;
  const { data, error } = await db()
    .from("lead_uri")
    .insert({ nume: `E2E ${sufix}`, telefon: `0799 ${sufix.slice(0, 3)} ${sufix.slice(3)}`, telefon_norm, serviciu: "site", sursa: "formular_site", ...camp })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function stergeLead(id: string) {
  // clientul făcut din lead rămâne după ștergere (lead_id devine null), deci îl ștergem întâi
  await db().from("clienti").delete().eq("lead_id", id);
  await db().from("lead_uri").delete().eq("id", id);
}

export async function idDe(cont: ContTest) {
  const { data } = await db().from("profiluri").select("id").eq("email", ECHIPA_TEST[cont].email).single();
  return data!.id;
}

/** Un client nou: lead trecut în „client” (trigger-ul face clientul și primul proiect). `stergeLead(leadId)` îl curăță. */
export async function clientNou(camp: Partial<LeadNou> = {}) {
  const lead = await leadNou({ stare: "programat", ...camp });
  const s = await db().from("lead_uri").update({ stare: "client" }).eq("id", lead.id);
  if (s.error) throw s.error;
  const c = await db().from("clienti").select("id").eq("lead_id", lead.id).single();
  if (c.error) throw c.error;
  const p = await db().from("proiecte").select("id").eq("client_id", c.data.id).single();
  if (p.error) throw p.error;
  return { leadId: lead.id, clientId: c.data.id, proiectId: p.data.id, nume: lead.nume };
}

/** Pune un om pe proiect (cu cheia de serviciu). */
export async function punePeProiect(proiectId: string, cont: ContTest, procent: number | null = null) {
  const { error } = await db().from("proiect_oameni").insert({ proiect_id: proiectId, om_id: await idDe(cont), procent });
  if (error) throw error;
}

/** Ziua din România peste `n` zile, ca „2026-11-20” (pentru câmpurile de dată). */
export function ziPeste(n: number): string {
  const azi = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [a, l, z] = azi.split("-").map(Number);
  return new Date(Date.UTC(a, l - 1, z + n)).toISOString().slice(0, 10);
}
