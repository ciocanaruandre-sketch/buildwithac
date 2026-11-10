"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { stergeFisiereleProiectului } from "@/lib/fisiere-bucket";
import { citesteLei, citesteProcent } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { SERVICII, STADII, type Serviciu, type Stadiu } from "@/lib/tipuri";

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

/** Doar Adminul: încă un proiect pentru același client (site acum, automatizare peste trei luni). Pornește în „Discuție”. */
export async function adaugaProiect(clientId: string, d: { titlu: string; serviciu: Serviciu }): Promise<{ ok: true; id: string } | { ok: false; mesaj: string }> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(clientId)) return { ok: false, mesaj: NEPERMIS };
  const titlu = d.titlu.trim();
  if (!titlu || titlu.length > 120) return { ok: false, mesaj: "Scrie titlul proiectului (cel mult 120 de caractere)." };
  if (!SERVICII.includes(d.serviciu)) return { ok: false, mesaj: "Alege serviciul." };
  const db = await supabase();
  const { data, error } = await db.from("proiecte").insert({ client_id: clientId, titlu, serviciu: d.serviciu, creat_de: om.id }).select("id").single();
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true, id: data.id };
}

/** Doar Adminul: colaborarea pe proiect s-a terminat (sau s-a reluat). De la închidere se numără anul de păstrare. */
export async function inchideProiect(proiectId: string, inchis: boolean): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data, error } = await db
    .from("proiecte")
    .update({ inchis_la: inchis ? new Date().toISOString() : null })
    .eq("id", proiectId)
    .select("client_id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  improspateaza(data[0].client_id);
  return { ok: true };
}

/**
 * Doar Adminul: șterge definitiv clientul. Ordinea contează:
 * 1) fișierele din Storage (dacă nu pleacă, nu ștergem nimic); 2) lead-ul din care a venit
 * (altfel rămâne pe veci în starea „client”, pe care jobul de 90 de zile n-o atinge); 3) clientul, cu tot ce ține de el.
 */
export async function stergeClient(clientId: string): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(clientId)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { data: c } = await db.from("clienti").select("id, lead_id").eq("id", clientId).maybeSingle();
  if (!c) return { ok: false, mesaj: "Clientul nu mai există." };
  const { data: proiecte, error: eProiecte } = await db.from("proiecte").select("id").eq("client_id", clientId);
  if (eProiecte) return { ok: false, mesaj: NESALVAT };

  for (const p of proiecte) {
    if (!(await stergeFisiereleProiectului(db, p.id))) return { ok: false, mesaj: "Fișierele n-au putut fi șterse. Încearcă din nou." };
  }
  if (c.lead_id) {
    const { error } = await db.from("lead_uri").delete().eq("id", c.lead_id);
    if (error) return { ok: false, mesaj: "Lead-ul clientului n-a putut fi șters. Încearcă din nou." };
  }
  const { data: sters, error } = await db.from("clienti").delete().eq("id", clientId).select("id");
  if (error || !sters.length) return { ok: false, mesaj: "Clientul n-a putut fi șters. Încearcă din nou." };
  revalidatePath("/clienti", "layout");
  revalidatePath("/lead-uri");
  return { ok: true };
}
