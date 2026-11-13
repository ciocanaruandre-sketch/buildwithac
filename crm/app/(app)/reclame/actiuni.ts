"use server";

import { revalidatePath } from "next/cache";
import type { Rezultat } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { citesteLei } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";

const NEPERMIS = "Nu ai voie să faci asta.";
const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const UUID = /^[0-9a-f-]{36}$/;
const SUMA_GRESITA = "Scrie suma în lei, fără virgule.";
const UNIC = "23505";

const eAdmin = async () => (await eu()).rol === "admin";
/** Spațiile de la capete scoase, cel mult 120 de caractere întregi, ca în linkurile reclamelor. */
const taie = (s: FormDataEntryValue | null) => Array.from(String(s ?? "").trim()).slice(0, 120).join("");

/** Suma cheltuită pe reclamă, din Ads Manager. Gol = încă nescrisă. */
export async function seteazaCheltuit(id: string, text: string): Promise<Rezultat> {
  if (!(await eAdmin()) || !UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const suma = citesteLei(text);
  if (suma === "gresit") return { ok: false, mesaj: SUMA_GRESITA };
  const db = await supabase();
  const { data, error } = await db.from("reclame").update({ cheltuit_lei: suma }).eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  revalidatePath("/reclame");
  return { ok: true };
}

/** O reclamă care n-a adus încă lead-uri, ca banii ei să intre în total. Primul lead cu aceleași nume se leagă de ea. */
export async function adaugaReclama(form: FormData): Promise<Rezultat> {
  if (!(await eAdmin())) return { ok: false, mesaj: NEPERMIS };
  const platforma = form.get("platforma");
  if (platforma !== "meta" && platforma !== "tiktok") return { ok: false, mesaj: "Alege platforma." };
  const campanie = taie(form.get("campanie"));
  const nume = taie(form.get("nume"));
  if (!nume) return { ok: false, mesaj: "Scrie numele reclamei, exact ca în Ads Manager." };
  const suma = citesteLei(String(form.get("cheltuit") ?? ""));
  if (suma === "gresit") return { ok: false, mesaj: SUMA_GRESITA };
  const db = await supabase();
  const { error } = await db.from("reclame").insert({ platforma, campanie, nume, cheltuit_lei: suma });
  if (error?.code === UNIC) return { ok: false, mesaj: "Reclama asta există deja." };
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  revalidatePath("/reclame");
  return { ok: true };
}

/** `unita` intră în `pastrata`: lead-urile și cheltuiala ei trec acolo. */
export async function unesteReclame(pastrata: string, unita: string): Promise<Rezultat> {
  if (!(await eAdmin()) || !UUID.test(pastrata) || !UUID.test(unita)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { error } = await db.rpc("uneste_reclame", { p_pastrata: pastrata, p_unita: unita });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  revalidatePath("/reclame");
  return { ok: true };
}

/** Doar o reclamă fără lead-uri (adăugată din greșeală). */
export async function stergeReclama(id: string): Promise<Rezultat> {
  if (!(await eAdmin()) || !UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { count, error: e1 } = await db.from("reclame_lead_uri").select("id", { count: "exact", head: true }).eq("reclama_id", id);
  if (e1) return { ok: false, mesaj: NESALVAT };
  if (count) return { ok: false, mesaj: "Reclama are lead-uri. Unește-o cu alta în loc s-o ștergi." };
  const { error } = await db.from("reclame").delete().eq("id", id);
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  revalidatePath("/reclame");
  return { ok: true };
}
