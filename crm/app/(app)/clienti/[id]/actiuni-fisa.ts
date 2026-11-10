"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { supabase } from "@/lib/supabase/server";
import { STARI_LIVRARE, type StareLivrare } from "@/lib/tipuri";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const NEPERMIS = "Nu ai voie să faci asta.";
const LINK_GRESIT = "Linkul trebuie să înceapă cu https://";
const UUID = /^[0-9a-f-]{36}$/;
const E_LINK = /^https?:\/\/\S+$/;

/** Tot ce e aici se lucrează de Admin și de constructorii de pe proiect; baza de date verifică (RLS). */
const improspateaza = () => revalidatePath("/clienti", "layout");

type Tabel = "notite_proiect" | "livrari";

/** Șterge un rând după id; zero rânduri șterse = n-ai voie (RLS l-a ascuns). */
async function sterge(tabel: Tabel, id: string): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data, error } = await db.from(tabel).delete().eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza();
  return { ok: true };
}

// ───────────── notițe ─────────────

export async function adaugaNotitaProiect(proiectId: string, text: string): Promise<Rezultat> {
  const om = await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const curat = text.trim();
  if (!curat) return { ok: false, mesaj: "Scrie notița." };
  const db = await supabase();
  const { error } = await db.from("notite_proiect").insert({ proiect_id: proiectId, autor_id: om.id, text: curat.slice(0, 5000) });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, "Nu poți scrie notițe pe proiectul ăsta.") };
  improspateaza();
  return { ok: true };
}

/** Doar Adminul (și RLS verifică la fel). */
export async function stergeNotitaProiect(id: string): Promise<Rezultat> {
  return sterge("notite_proiect", id);
}

// ───────────── livrat ─────────────

export async function adaugaLivrare(proiectId: string, d: { titlu: string; link: string; nota: string }): Promise<Rezultat> {
  await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const titlu = d.titlu.trim();
  if (!titlu) return { ok: false, mesaj: "Scrie ce i-ai trimis." };
  if (titlu.length > 200) return { ok: false, mesaj: "Titlul are cel mult 200 de caractere." };
  const link = d.link.trim() || null;
  if (link && !E_LINK.test(link)) return { ok: false, mesaj: LINK_GRESIT };
  const nota = d.nota.trim().slice(0, 1000) || null;
  const db = await supabase();
  const { error } = await db.from("livrari").insert({ proiect_id: proiectId, titlu, link, nota });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NEPERMIS) };
  improspateaza();
  return { ok: true };
}

export async function schimbaStareLivrare(id: string, stare: StareLivrare): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id) || !STARI_LIVRARE.includes(stare)) return { ok: false, mesaj: NESALVAT };
  const db = await supabase();
  const { data, error } = await db.from("livrari").update({ stare }).eq("id", id).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza();
  return { ok: true };
}

export async function stergeLivrare(id: string): Promise<Rezultat> {
  return sterge("livrari", id);
}
