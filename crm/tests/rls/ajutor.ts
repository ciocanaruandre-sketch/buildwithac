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
