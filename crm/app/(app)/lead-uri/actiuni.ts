"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { supabase } from "@/lib/supabase/server";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

/** „Îmi iau lead-ul”: merge doar dacă e încă liber. Dacă l-a luat altcineva între timp, spunem cine. */
export async function iaLead(id: string): Promise<Rezultat> {
  const om = await eu();
  const db = await supabase();
  const { data, error } = await db.from("lead_uri").update({ caller_id: om.id }).eq("id", id).is("caller_id", null).select("id");
  if (error) return { ok: false, mesaj: "Nu ai voie să-ți iei lead-ul ăsta." };
  if (!data.length) {
    const { data: l } = await db.from("lead_uri").select("caller:profiluri!lead_uri_caller_id_fkey(nume)").eq("id", id).maybeSingle();
    const nume = (l?.caller as { nume: string } | null)?.nume;
    return { ok: false, mesaj: nume ? `L-a luat deja ${nume}.` : "Lead-ul nu mai e liber." };
  }
  revalidatePath("/lead-uri");
  return { ok: true };
}
