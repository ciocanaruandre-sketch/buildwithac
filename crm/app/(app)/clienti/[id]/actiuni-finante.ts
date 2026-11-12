"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { planDePlata, totaluriProiect, type AlegerePlan, type Transa } from "@/lib/finante";
import { citesteLei, citesteProcent } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { ziuaRomaniei } from "@/lib/timp";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

/** Ce scrie Adminul în formularul planului; se citește aici, pe server. Avansul: „2.000” (lei) sau „30%”. */
export type PlanScris = { fel: "odata" | "avans" | "rate"; zi: string; ziRest: string; avans: string; nr: string };

const NESALVAT = "Nu s-a salvat. Încearcă din nou.";
const NEPERMIS = "Nu ai voie să faci asta.";
const UUID = /^[0-9a-f-]{36}$/;
const ZI = /^\d{4}-\d{2}-\d{2}$/;
const ziBuna = (z: string) => ZI.test(z) && !Number.isNaN(new Date(`${z}T00:00:00Z`).getTime());

type Db = Awaited<ReturnType<typeof supabase>>;

function improspateaza(clientId: string) {
  revalidatePath(`/clienti/${clientId}`);
  revalidatePath("/clienti");
  revalidatePath("/finante");
}

/** Adminul sau nimic. Întoarce clientul bazei de date, ca acțiunile să nu-l facă de două ori. */
async function caAdmin(): Promise<Db | null> {
  const om = await eu();
  return om.rol === "admin" ? supabase() : null;
}

async function clientulProiectului(db: Db, proiectId: string): Promise<string | null> {
  const { data } = await db.from("proiecte").select("client_id").eq("id", proiectId).maybeSingle();
  return data?.client_id ?? null;
}

async function clientulTransei(db: Db, transaId: string): Promise<string | null> {
  const { data } = await db.from("transe").select("proiect_id").eq("id", transaId).maybeSingle();
  return data ? clientulProiectului(db, data.proiect_id) : null;
}

/** Planul ales, citit și verificat. Prețul e cel rămas de încasat (la „Schimbă planul”) sau prețul întreg. */
async function citestePlan(d: PlanScris, pret: number): Promise<AlegerePlan | string> {
  if (d.fel === "odata") return ziBuna(d.zi) ? { fel: "odata", zi: d.zi } : "Alege data plății.";
  if (d.fel === "rate") {
    const nr = Number(d.nr);
    if (!Number.isInteger(nr) || nr < 2 || nr > 36) return "Numărul de rate e între 2 și 36.";
    if (!ziBuna(d.zi)) return "Alege data primei rate.";
    if (pret < nr) return "Prețul e prea mic pentru atâtea rate.";
    return { fel: "rate", nr, primaZi: d.zi };
  }
  if (!ziBuna(d.zi) || !ziBuna(d.ziRest)) return "Alege data avansului și data restului.";
  const scris = d.avans.trim();
  if (scris.endsWith("%")) {
    const p = citesteProcent(scris);
    if (p === null || p === "gresit" || p <= 0 || p >= 100) return "Avansul în procente e între 1 și 99.";
    return { fel: "avans", avans: { procent: p }, ziAvans: d.zi, ziRest: d.ziRest };
  }
  const lei = citesteLei(scris);
  if (lei === null || lei === "gresit" || lei <= 0 || lei >= pret) return "Avansul e mai mic decât prețul (lei sau procent, ca „30%”).";
  return { fel: "avans", avans: { lei }, ziAvans: d.zi, ziRest: d.ziRest };
}

async function scriePlan(db: Db, proiectId: string, d: PlanScris, schimba: boolean): Promise<Rezultat> {
  const { data: p } = await db.from("proiecte").select("client_id, pret_lei").eq("id", proiectId).maybeSingle();
  if (!p) return { ok: false, mesaj: NEPERMIS };
  if (!p.pret_lei) return { ok: false, mesaj: "Pune întâi prețul proiectului (din „Schimbă”, la Proiectul)." };
  const { data: transe, error: e } = await db.from("transe").select("*").eq("proiect_id", proiectId).is("abonament_id", null);
  if (e) return { ok: false, mesaj: NESALVAT };
  const neincasate = transe.filter((t) => !t.incasata_la);
  if (!schimba && neincasate.length) return { ok: false, mesaj: "Proiectul are deja un plan. Schimbă-l." };

  // la schimbare, planul nou acoperă doar ce n-a intrat încă
  const ramas = p.pret_lei - totaluriProiect(transe as Transa[]).incasat;
  if (ramas <= 0) return { ok: false, mesaj: "Prețul e încasat tot. Pentru bani în plus, adaugă o tranșă." };
  const plan = await citestePlan(d, ramas);
  if (typeof plan === "string") return { ok: false, mesaj: plan };

  if (neincasate.length) {
    const { error } = await db.from("transe").delete().in("id", neincasate.map((t) => t.id));
    if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  }
  const { error } = await db.from("transe").insert(planDePlata(ramas, plan).map((t) => ({ ...t, proiect_id: proiectId })));
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(p.client_id);
  return { ok: true };
}

/** Doar Adminul: primul plan de plată al proiectului. */
export async function facePlan(proiectId: string, d: PlanScris): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  return scriePlan(db, proiectId, d, false);
}

/** Doar Adminul: tranșele neîncasate pleacă, vin cele noi pentru ce a rămas de încasat. Cele încasate rămân. */
export async function schimbaPlan(proiectId: string, d: PlanScris): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  return scriePlan(db, proiectId, d, true);
}

function citesteTransa(d: { eticheta: string; suma: string; zi: string }): { eticheta: string; suma_lei: number; scadenta: string } | string {
  const eticheta = d.eticheta.trim() || "Tranșă";
  if (eticheta.length > 60) return "Numele tranșei are cel mult 60 de caractere.";
  const suma = citesteLei(d.suma);
  if (suma === null || suma === "gresit" || suma <= 0) return "Scrie suma în lei, fără zecimale.";
  if (!ziBuna(d.zi)) return "Alege data scadenței.";
  return { eticheta, suma_lei: suma, scadenta: d.zi };
}

export async function adaugaTransa(proiectId: string, d: { eticheta: string; suma: string; zi: string }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const t = citesteTransa(d);
  if (typeof t === "string") return { ok: false, mesaj: t };
  const clientId = await clientulProiectului(db, proiectId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("transe").insert({ ...t, proiect_id: proiectId, tip: "extra" });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function schimbaTransa(transaId: string, d: { eticheta: string; suma: string; zi: string }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(transaId)) return { ok: false, mesaj: NEPERMIS };
  const t = citesteTransa(d);
  if (typeof t === "string") return { ok: false, mesaj: t };
  const clientId = await clientulTransei(db, transaId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("transe").update(t).eq("id", transaId);
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function stergeTransa(transaId: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(transaId)) return { ok: false, mesaj: NEPERMIS };
  const clientId = await clientulTransei(db, transaId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("transe").delete().eq("id", transaId);
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

/** „Am încasat”: suma și data (implicit tranșa întreagă, azi). Peste sumă doar cu `peste` (confirmat pe ecran). */
export async function incaseaza(transaId: string, d: { suma: string; zi: string; peste: boolean }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(transaId)) return { ok: false, mesaj: NEPERMIS };
  const suma = citesteLei(d.suma);
  if (suma === null || suma === "gresit" || suma <= 0) return { ok: false, mesaj: "Scrie suma încasată, în lei." };
  if (!ziBuna(d.zi)) return { ok: false, mesaj: "Alege data încasării." };
  if (d.zi > ziuaRomaniei(new Date())) return { ok: false, mesaj: "Data încasării nu poate fi în viitor." };
  const clientId = await clientulTransei(db, transaId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.rpc("incaseaza", { t: transaId, suma, zi: d.zi, peste: d.peste });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function anuleazaIncasare(transaId: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(transaId)) return { ok: false, mesaj: NEPERMIS };
  const clientId = await clientulTransei(db, transaId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.rpc("anuleaza_incasare", { t: transaId });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function returneaza(transaId: string, d: { suma: string; zi: string }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(transaId)) return { ok: false, mesaj: NEPERMIS };
  const suma = citesteLei(d.suma);
  if (suma === null || suma === "gresit" || suma <= 0) return { ok: false, mesaj: "Scrie suma returnată, în lei." };
  if (!ziBuna(d.zi)) return { ok: false, mesaj: "Alege data returnării." };
  const clientId = await clientulTransei(db, transaId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.rpc("returneaza", { t: transaId, suma, zi: d.zi });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

/** Bifa „plătit” pe un comision (sau scoaterea ei, la o bifă greșită). */
export async function bifeazaComision(comisionId: string, platit: boolean): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(comisionId)) return { ok: false, mesaj: NEPERMIS };
  const { data, error } = await db
    .from("comisioane")
    .update({ platit_la: platit ? ziuaRomaniei(new Date()) : null })
    .eq("id", comisionId)
    .select("proiect_id");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  const clientId = data[0].proiect_id ? await clientulProiectului(db, data[0].proiect_id) : null;
  if (clientId) improspateaza(clientId);
  else revalidatePath("/finante");
  return { ok: true };
}

function citesteAbonament(d: { suma: string; zi: string }): { suma: number; zi: number } | string {
  const suma = citesteLei(d.suma);
  if (suma === null || suma === "gresit" || suma <= 0) return "Scrie suma lunară, în lei.";
  const zi = Number(d.zi);
  if (!Number.isInteger(zi) || zi < 1 || zi > 28) return "Ziua din lună e între 1 și 28.";
  return { suma, zi };
}

export async function pornesteAbonament(proiectId: string, d: { suma: string; zi: string; porneste: string; omId: string }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  const a = citesteAbonament(d);
  if (typeof a === "string") return { ok: false, mesaj: a };
  if (!ziBuna(d.porneste)) return { ok: false, mesaj: "Alege data de pornire." };
  if (d.omId && !UUID.test(d.omId)) return { ok: false, mesaj: "Alege omul." };
  const clientId = await clientulProiectului(db, proiectId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  // fără om ales: primul constructor de pe proiect (îl alege funcția)
  const { error } = await db.rpc("porneste_abonament", { p: proiectId, suma: a.suma, zi: a.zi, porneste: d.porneste, om: (d.omId || null) as string });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

async function clientulAbonamentului(db: Db, abonamentId: string): Promise<string | null> {
  const { data } = await db.from("abonamente").select("proiect_id").eq("id", abonamentId).maybeSingle();
  return data ? clientulProiectului(db, data.proiect_id) : null;
}

export async function schimbaAbonament(abonamentId: string, d: { suma: string; zi: string }): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(abonamentId)) return { ok: false, mesaj: NEPERMIS };
  const a = citesteAbonament(d);
  if (typeof a === "string") return { ok: false, mesaj: a };
  const clientId = await clientulAbonamentului(db, abonamentId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.rpc("schimba_abonament", { a: abonamentId, suma: a.suma, zi: a.zi });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function opresteAbonament(abonamentId: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(abonamentId)) return { ok: false, mesaj: NEPERMIS };
  const clientId = await clientulAbonamentului(db, abonamentId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.rpc("opreste_abonament", { a: abonamentId });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function schimbaProcentAbonament(abonamentId: string, omId: string, procent: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(abonamentId) || !UUID.test(omId)) return { ok: false, mesaj: NEPERMIS };
  const p = citesteProcent(procent);
  if (p === "gresit") return { ok: false, mesaj: "Procentul e între 0 și 100." };
  const clientId = await clientulAbonamentului(db, abonamentId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("abonament_oameni").upsert({ abonament_id: abonamentId, om_id: omId, procent: p }, { onConflict: "abonament_id,om_id" });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

/** Callerul sau closerul cu procent pe proiect (nu le dă acces la fișă). Același om, alt procent = schimbare. */
export async function puneVanzator(proiectId: string, omId: string, procent: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId)) return { ok: false, mesaj: NEPERMIS };
  if (!UUID.test(omId)) return { ok: false, mesaj: "Alege omul." };
  const p = citesteProcent(procent);
  if (p === "gresit") return { ok: false, mesaj: "Procentul e între 0 și 100." };
  const clientId = await clientulProiectului(db, proiectId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("proiect_vanzari").upsert({ proiect_id: proiectId, om_id: omId, procent: p }, { onConflict: "proiect_id,om_id" });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}

export async function scoateVanzator(proiectId: string, omId: string): Promise<Rezultat> {
  const db = await caAdmin();
  if (!db || !UUID.test(proiectId) || !UUID.test(omId)) return { ok: false, mesaj: NEPERMIS };
  const clientId = await clientulProiectului(db, proiectId);
  if (!clientId) return { ok: false, mesaj: NEPERMIS };
  const { error } = await db.from("proiect_vanzari").delete().eq("proiect_id", proiectId).eq("om_id", omId);
  if (error) return { ok: false, mesaj: mesajDinBaza(error, NESALVAT) };
  improspateaza(clientId);
  return { ok: true };
}
