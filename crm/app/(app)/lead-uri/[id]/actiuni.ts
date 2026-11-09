"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { actiuniPermise, stareDupa, type Actiune } from "@/lib/stari";
import { supabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/baza.types";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };
type Schimbare = Database["public"]["Tables"]["lead_uri"]["Update"];
const NEPERMIS = "Nu ai voie să faci asta pe lead-ul ăsta.";

/** Un buton din fișă: mută lead-ul în starea potrivită. Baza de date verifică din nou (RLS + trigger). */
export async function aplicaActiune(id: string, a: Exclude<Actiune, "ia_lead" | "programeaza">, extra: { callbackLa?: string; motiv?: string } = {}): Promise<Rezultat> {
  const om = await eu();
  const db = await supabase();
  const { data: l } = await db.from("lead_uri").select("stare, caller_id, closer_id, incercari").eq("id", id).maybeSingle();
  if (!l || !actiuniPermise(l, om.rol, om.id).includes(a)) return { ok: false, mesaj: NEPERMIS };

  const schimbare: Schimbare = { stare: stareDupa(a), callback_la: null };
  if (a === "nu_raspunde") schimbare.incercari = l.incercari + 1;
  if (a === "callback") {
    const la = extra.callbackLa ? new Date(extra.callbackLa) : null;
    if (!la || Number.isNaN(la.getTime()) || la.getTime() <= Date.now()) return { ok: false, mesaj: "Alege o oră din viitor." };
    schimbare.callback_la = la.toISOString();
  }
  if (a === "pierdut" || a === "descalificat") {
    const motiv = extra.motiv?.trim() ?? "";
    if (motiv.length < 3) return { ok: false, mesaj: "Scrie motivul." };
    schimbare.motiv = motiv.slice(0, 500);
  }

  const { error } = await db.from("lead_uri").update(schimbare).eq("id", id);
  if (error) return { ok: false, mesaj: NEPERMIS };
  revalidatePath(`/lead-uri/${id}`);
  return { ok: true };
}

export async function adaugaNotita(id: string, text: string, linkVocal?: string): Promise<Rezultat> {
  const om = await eu();
  const curat = text.trim();
  if (!curat) return { ok: false, mesaj: "Scrie notița." };
  const link = linkVocal?.trim() || null;
  if (link && !/^https?:\/\//.test(link)) return { ok: false, mesaj: "Linkul notei vocale trebuie să înceapă cu https://" };
  const db = await supabase();
  const { error } = await db.from("notite").insert({ lead_id: id, autor_id: om.id, text: curat.slice(0, 5000), link_vocal: link });
  if (error) return { ok: false, mesaj: "Nu poți scrie notițe pe lead-ul ăsta." };
  revalidatePath(`/lead-uri/${id}`);
  return { ok: true };
}

/** „Programează discuția”: totul într-o singură tranzacție, în baza de date (funcția programeaza_discutie). */
export async function programeaza(id: string, closerId: string, incepe: string): Promise<Rezultat> {
  await eu();
  const db = await supabase();
  const { error } = await db.rpc("programeaza_discutie", { p_lead: id, p_closer: closerId, p_incepe: incepe });
  if (error?.code === "23P01") return { ok: false, mesaj: "Ora asta tocmai s-a ocupat. Alege alta." };
  if (error) return { ok: false, mesaj: error.message || NEPERMIS };
  revalidatePath(`/lead-uri/${id}`);
  return { ok: true };
}

/** Doar Adminul: mută lead-ul la alt caller sau closer (sau îl lasă liber). */
export async function mutaLead(id: string, camp: "caller_id" | "closer_id", la: string | null): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin") return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const schimbare: Schimbare = camp === "caller_id" ? { caller_id: la || null } : { closer_id: la || null };
  const { error } = await db.from("lead_uri").update(schimbare).eq("id", id);
  // discuția programată trece și ea la closerul nou (trigger-ul discutii_dupa_lead)
  if (error?.code === "23P01") return { ok: false, mesaj: "Closerul ales are deja o discuție la ora aceea. Reprogramează întâi discuția." };
  if (error) return { ok: false, mesaj: NEPERMIS };
  revalidatePath(`/lead-uri/${id}`);
  return { ok: true };
}
