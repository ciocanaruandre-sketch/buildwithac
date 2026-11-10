"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { citesteLei, citesteProcent } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { STADII, type Stadiu } from "@/lib/tipuri";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const NEPERMIS = "Nu ai voie să faci asta.";
const UUID = /^[0-9a-f-]{36}$/;
const ZI = /^\d{4}-\d{2}-\d{2}$/;

function improspateaza(clientId: string) {
  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
}

/** Stadiul îl schimbă Adminul sau un constructor de pe proiect. Baza de date verifică din nou (RLS + trigger). */
export async function schimbaStadiu(proiectId: string, stadiu: Stadiu): Promise<Rezultat> {
  await eu();
  if (!UUID.test(proiectId) || !STADII.includes(stadiu)) return { ok: false, mesaj: NESALVAT };
  const db = await supabase();
  const { data, error } = await db.from("proiecte").update({ stadiu }).eq("id", proiectId).select("client_id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza(data[0].client_id);
  return { ok: true };
}

/** Doar Adminul: titlul, prețul, încasatul și termenul de predare. */
export async function salveazaProiect(proiectId: string, d: { titlu: string; pretLei: string; incasatLei: string; termen: string }): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };

  const titlu = d.titlu.trim();
  if (!titlu || titlu.length > 120) return { ok: false, mesaj: "Scrie titlul proiectului (cel mult 120 de caractere)." };
  const pret = citesteLei(d.pretLei);
  const incasat = citesteLei(d.incasatLei);
  if (pret === "gresit" || incasat === "gresit") return { ok: false, mesaj: "Scrie suma în lei, fără zecimale." };
  const termen = d.termen.trim() || null;
  if (termen && (!ZI.test(termen) || Number.isNaN(new Date(`${termen}T00:00:00Z`).getTime()))) return { ok: false, mesaj: "Alege o dată pentru predare." };

  const db = await supabase();
  const { data, error } = await db
    .from("proiecte")
    .update({ titlu, pret_lei: pret, incasat_lei: incasat ?? 0, termen })
    .eq("id", proiectId)
    .select("client_id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza(data[0].client_id);
  return { ok: true };
}

/** Doar Adminul: pune un constructor pe proiect sau îi schimbă procentul (același om, alt procent). */
export async function adaugaOm(proiectId: string, omId: string, procent: string): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  if (!UUID.test(omId)) return { ok: false, mesaj: "Alege omul." };
  const p = citesteProcent(procent);
  if (p === "gresit") return { ok: false, mesaj: "Procentul e între 0 și 100." };

  const db = await supabase();
  const { data: proiect } = await db.from("proiecte").select("client_id").eq("id", proiectId).maybeSingle();
  if (!proiect) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("proiect_oameni").upsert({ proiect_id: proiectId, om_id: omId, procent: p }, { onConflict: "proiect_id,om_id" });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(proiect.client_id);
  return { ok: true };
}

/** Doar Adminul: scoate omul de pe proiect. Task-urile lui neterminate rămân fără om (trigger). */
export async function scoateOm(proiectId: string, omId: string): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(proiectId) || !UUID.test(omId)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data: proiect } = await db.from("proiecte").select("client_id").eq("id", proiectId).maybeSingle();
  if (!proiect) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("proiect_oameni").delete().eq("proiect_id", proiectId).eq("om_id", omId);
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(proiect.client_id);
  return { ok: true };
}

/** Doar Adminul: numele, telefonul și e-mailul clientului. */
export async function salveazaContact(clientId: string, d: { nume: string; telefon: string; email: string }): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(clientId)) return { ok: false, mesaj: NEPERMIS };

  const nume = d.nume.trim();
  if (!nume || nume.length > 120) return { ok: false, mesaj: "Scrie numele (cel mult 120 de caractere)." };
  const telefon = d.telefon.trim().slice(0, 40) || null;
  const email = d.email.trim().slice(0, 200) || null;
  if (!telefon && !email) return { ok: false, mesaj: "Scrie măcar telefonul sau e-mailul." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, mesaj: "E-mailul nu arată bine." };

  const db = await supabase();
  const { data, error } = await db.from("clienti").update({ nume, telefon, email }).eq("id", clientId).select("id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza(clientId);
  return { ok: true };
}
