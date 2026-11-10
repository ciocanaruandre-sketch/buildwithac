"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { BUCKET, MARIME_MAXIMA, desfaCalea, numeCurat } from "@/lib/fisiere";
import { supabase } from "@/lib/supabase/server";
import { AL_CUI, STARI_LIVRARE, UNDE_PAROLA, type AlCui, type StareLivrare, type UndeParola } from "@/lib/tipuri";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const NEPERMIS = "Nu ai voie să faci asta.";
const LINK_GRESIT = "Linkul trebuie să înceapă cu https://";
const UUID = /^[0-9a-f-]{36}$/;
const E_LINK = /^https?:\/\/\S+$/;

/** Tot ce e aici se lucrează de Admin și de constructorii de pe proiect; baza de date verifică (RLS). */
const improspateaza = () => revalidatePath("/clienti", "layout");

type Tabel = "notite_proiect" | "livrari" | "conturi" | "materiale";

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

// ───────────── conturi (fără parole) ─────────────

export async function adaugaCont(proiectId: string, d: { serviciu: string; cont: string; alCui: string; undeParola: string }): Promise<Rezultat> {
  await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const serviciu = d.serviciu.trim();
  const cont = d.cont.trim();
  if (!serviciu) return { ok: false, mesaj: "Scrie serviciul (de exemplu Vercel sau domeniul)." };
  if (!cont) return { ok: false, mesaj: "Scrie contul: numele sau adresa, nu parola." };
  if (serviciu.length > 120 || cont.length > 200) return { ok: false, mesaj: "Textul e prea lung." };
  if (!(AL_CUI as readonly string[]).includes(d.alCui) || !(UNDE_PAROLA as readonly string[]).includes(d.undeParola)) return { ok: false, mesaj: "Alege din liste." };
  const db = await supabase();
  const { error } = await db.from("conturi").insert({ proiect_id: proiectId, serviciu, cont, al_cui: d.alCui as AlCui, unde_parola: d.undeParola as UndeParola });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NEPERMIS) };
  improspateaza();
  return { ok: true };
}

export async function stergeCont(id: string): Promise<Rezultat> {
  return sterge("conturi", id);
}

// ───────────── materiale ─────────────

export async function adaugaLink(proiectId: string, d: { titlu: string; url: string; nota: string }): Promise<Rezultat> {
  await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const titlu = d.titlu.trim();
  if (!titlu) return { ok: false, mesaj: "Scrie un titlu." };
  if (titlu.length > 200) return { ok: false, mesaj: "Titlul are cel mult 200 de caractere." };
  const url = d.url.trim();
  if (!E_LINK.test(url)) return { ok: false, mesaj: LINK_GRESIT };
  const nota = d.nota.trim().slice(0, 500) || null;
  const db = await supabase();
  const { error } = await db.from("materiale").insert({ proiect_id: proiectId, titlu, url, nota });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NEPERMIS) };
  improspateaza();
  return { ok: true };
}

const PREA_MARE = "Fișierul are peste 25 MB. Pune-l pe Drive și adaugă link-ul.";
const N_A_AJUNS = "Fișierul n-a ajuns. Încearcă din nou.";

/**
 * Pasul 1 al încărcării: verifică mărimea și face un link semnat de urcare, cu sesiunea omului
 * (regula din Storage hotărăște dacă are voie). Fișierul urcă apoi direct din browser în Supabase.
 */
export async function pregatesteIncarcare(proiectId: string, nume: string, marime: number): Promise<{ ok: true; cale: string; token: string } | { ok: false; mesaj: string }> {
  await eu();
  if (!UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  if (!Number.isInteger(marime) || marime <= 0) return { ok: false, mesaj: "Fișierul e gol." };
  if (marime > MARIME_MAXIMA) return { ok: false, mesaj: PREA_MARE };
  const cale = `${proiectId}/${crypto.randomUUID()}/${numeCurat(nume)}`;
  const db = await supabase();
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(cale);
  if (error || !data) return { ok: false, mesaj: NEPERMIS };
  return { ok: true, cale, token: data.token };
}

/** Pasul 3: fișierul e în bucket; îl trecem la Materiale. Dacă rândul nu se poate scrie, fișierul se șterge. */
export async function confirmaFisier(proiectId: string, d: { titlu: string; cale: string; nota: string }): Promise<Rezultat> {
  await eu();
  const cale = desfaCalea(d.cale);
  if (!UUID.test(proiectId) || !cale || cale.proiectId !== proiectId) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  // mărimea o luăm din bucket, nu din ce spune browserul
  const { data: fisiere } = await db.storage.from(BUCKET).list(cale.dosar);
  const fisier = fisiere?.find((f) => f.name === cale.nume);
  if (!fisier) return { ok: false, mesaj: N_A_AJUNS };
  const marime = typeof fisier.metadata?.size === "number" ? fisier.metadata.size : null;

  const titlu = d.titlu.trim().slice(0, 200) || cale.nume;
  const nota = d.nota.trim().slice(0, 500) || null;
  const { error } = await db.from("materiale").insert({ proiect_id: proiectId, titlu, cale: d.cale, marime, nota });
  if (error) {
    await db.storage.from(BUCKET).remove([d.cale]);
    return { ok: false, mesaj: mesajDinBaza(error, N_A_AJUNS) };
  }
  improspateaza();
  return { ok: true };
}

/** Șterge materialul; dacă e un fișier, întâi fișierul din bucket (ca să nu rămână orfan). */
export async function stergeMaterial(id: string): Promise<Rezultat> {
  await eu();
  if (!UUID.test(id)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data: m } = await db.from("materiale").select("cale").eq("id", id).maybeSingle();
  if (!m) return { ok: false, mesaj: NEPERMIS };
  if (m.cale) {
    const { error } = await db.storage.from(BUCKET).remove([m.cale]);
    if (error) return { ok: false, mesaj: "Fișierul n-a putut fi șters. Încearcă din nou." };
  }
  return sterge("materiale", id);
}
