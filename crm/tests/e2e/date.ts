import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/baza.types";

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

export async function idDe(cont: string) {
  const { data } = await db().from("profiluri").select("id").eq("email", `${cont}@test.buildwithac.ro`).single();
  return data!.id;
}
