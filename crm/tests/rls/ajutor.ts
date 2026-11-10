import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { admin } from "@/lib/supabase/admin";

export { admin };
export type Cont = "admin" | "caller" | "caller2" | "closer" | "constructor";
export const emailTest = (c: Cont) => `${c}@test.buildwithac.ro`;

const sesiuni = new Map<Cont, SupabaseClient<Database>>();

/** Clientul Supabase al unui cont de test, conectat cu parola din CRM_PAROLA_TEST. */
export async function conecteazaCa(cont: Cont): Promise<SupabaseClient<Database>> {
  const gata = sesiuni.get(cont);
  if (gata) return gata;
  const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await db.auth.signInWithPassword({ email: emailTest(cont), password: process.env.CRM_PAROLA_TEST! });
  if (error) throw new Error(`Nu mă pot conecta ca ${cont}: ${error.message}`);
  sesiuni.set(cont, db);
  return db;
}

/** Id-ul profilului unui cont de test. */
export async function idDe(cont: Cont): Promise<string> {
  const { data, error } = await admin().from("profiluri").select("id").eq("email", emailTest(cont)).single();
  if (error) throw error;
  return data.id;
}

let n = 0;
/** Un lead nou, creat cu cheia de serviciu; numărul de telefon e unic pe rulare. */
export async function leadDeTest(camp: Partial<Database["public"]["Tables"]["lead_uri"]["Insert"]> = {}) {
  const tel = `4079${Date.now().toString().slice(-6)}${n++ % 10}`;
  const { data, error } = await admin()
    .from("lead_uri")
    .insert({ nume: "Test RLS", telefon: tel, telefon_norm: tel, serviciu: "site", sursa: "formular_site", ...camp })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sterge(id: string) {
  await admin().from("lead_uri").delete().eq("id", id);
}

/** Un lead trecut în „client” (trigger-ul face clientul și primul proiect). */
export async function clientDeTest(camp: Partial<Database["public"]["Tables"]["lead_uri"]["Insert"]> = {}) {
  const lead = await leadDeTest({ stare: "programat", ...camp });
  const s = await admin().from("lead_uri").update({ stare: "client" }).eq("id", lead.id);
  if (s.error) throw s.error;
  const c = await admin().from("clienti").select("id").eq("lead_id", lead.id).single();
  if (c.error) throw c.error;
  const p = await admin().from("proiecte").select("id").eq("client_id", c.data.id).single();
  if (p.error) throw p.error;
  return { lead, clientId: c.data.id, proiectId: p.data.id };
}

/** Șterge clientul făcut din lead (cu proiectele lui), apoi lead-ul. */
export async function stergeClient(leadId: string) {
  await admin().from("clienti").delete().eq("lead_id", leadId);
  await admin().from("lead_uri").delete().eq("id", leadId);
}

const temporari: string[] = [];
/** Un cont temporar (fără parolă), ca testele să nu atingă datele conturilor din seed. */
export async function omTemporar(rol: "caller" | "closer" | "constructor", activ = true): Promise<string> {
  const email = `temp${Date.now()}${temporari.length}@test.buildwithac.ro`;
  const { data, error } = await admin().auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  temporari.push(data.user.id);
  const p = await admin().from("profiluri").insert({ id: data.user.id, nume: `Temp ${rol}`, email, rol, activ });
  if (p.error) throw p.error;
  return data.user.id;
}

export async function stergeTemporari() {
  for (const id of temporari.splice(0)) await admin().auth.admin.deleteUser(id);
}
