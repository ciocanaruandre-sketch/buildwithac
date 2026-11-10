"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { supabase } from "@/lib/supabase/server";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };
export type DateTask = { titlu: string; omId: string; termen: string };

const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const NEPERMIS = "Nu ai voie să faci asta.";
const UUID = /^[0-9a-f-]{36}$/;
const ZI = /^\d{4}-\d{2}-\d{2}$/;

function improspateaza() {
  revalidatePath("/clienti", "layout");
  revalidatePath("/taskuri");
}

/** Ce a scris omul → coloanele din bază, sau mesajul de arătat. */
function citeste(d: DateTask): { titlu: string; om_id: string | null; termen: string | null } | string {
  const titlu = d.titlu.trim();
  if (!titlu) return "Scrie ce e de făcut.";
  if (titlu.length > 200) return "Titlul are cel mult 200 de caractere.";
  if (d.omId && !UUID.test(d.omId)) return "Alege omul din listă.";
  const termen = d.termen.trim() || null;
  if (termen && (!ZI.test(termen) || Number.isNaN(new Date(`${termen}T00:00:00Z`).getTime()))) return "Alege o dată pentru termen.";
  return { titlu, om_id: d.omId || null, termen };
}

/** Task-urile le lucrează Adminul și constructorii de pe proiect; baza de date verifică (RLS + trigger). */
export async function adaugaTask(proiectId: string, d: DateTask): Promise<Rezultat> {
  await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const t = citeste(d);
  if (typeof t === "string") return { ok: false, mesaj: t };
  const db = await supabase();
  const { error } = await db.from("taskuri").insert({ proiect_id: proiectId, ...t });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NEPERMIS) };
  improspateaza();
  return { ok: true };
}

export async function bifeazaTask(id: string, gata: boolean): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data, error } = await db.from("taskuri").update({ gata }).eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza();
  return { ok: true };
}

export async function schimbaTask(id: string, d: DateTask): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const t = citeste(d);
  if (typeof t === "string") return { ok: false, mesaj: t };
  const db = await supabase();
  const { data, error } = await db.from("taskuri").update(t).eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza();
  return { ok: true };
}

export async function stergeTask(id: string): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data, error } = await db.from("taskuri").delete().eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza();
  return { ok: true };
}
