"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { trimiteEmail } from "@/lib/email";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { ROLURI_ECHIPA, construiesteInvitatie } from "@/lib/invitatie";
import { admin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/server";
import { normalizeazaEmail } from "@/lib/telefon";
import type { Rol } from "@/lib/tipuri";

export type Rezultat = { ok: true; mesaj?: string; link?: string } | { ok: false; mesaj: string };

const NU_E_ADMIN: Rezultat = { ok: false, mesaj: "Doar Adminul schimbă echipa." };
const lead = (n: number) => (n === 1 ? "1 lead" : `${n} lead-uri`);

async function origine() {
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/** Linkul spre /auth/confirm + e-mailul prin Resend. Dacă nu pleacă, adminul primește linkul. */
async function trimiteLink(email: string, nume: string, rol: Rol, hash: string, tip: "invite" | "recovery"): Promise<Rezultat> {
  const link = `${await origine()}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=${tip}`;
  const e = construiesteInvitatie(nume, rol, link);
  if (await trimiteEmail({ catre: email, ...e })) return { ok: true, mesaj: `Invitația a plecat pe ${email}.` };
  return { ok: true, mesaj: "E-mailul n-a plecat. Trimite-i tu linkul ăsta (merge o singură dată):", link };
}

/** Contul nou: omul primește linkul și își alege parola. Rândul din profiluri îl face Adminul, cu rolul. */
export async function invita(emailScris: string, numeScris: string, rol: Rol): Promise<Rezultat> {
  if ((await eu()).rol !== "admin") return NU_E_ADMIN;
  const nume = numeScris.trim().slice(0, 80);
  const email = normalizeazaEmail(emailScris);
  if (nume.length < 2) return { ok: false, mesaj: "Scrie numele." };
  if (!email) return { ok: false, mesaj: "Adresa de e-mail nu pare corectă." };
  if (!(ROLURI_ECHIPA as readonly Rol[]).includes(rol)) return { ok: false, mesaj: "Alege rolul." };

  const a = admin();
  const { data: exista } = await a.from("profiluri").select("id").eq("email", email).maybeSingle();
  if (exista) return { ok: false, mesaj: "Omul ăsta are deja cont." };

  const { data, error } = await a.auth.admin.generateLink({ type: "invite", email, options: { data: { nume } } });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { ok: false, mesaj: "Adresa are deja cont în Supabase, dar fără profil. Scrie-mi și o repar." };
    return { ok: false, mesaj: "Invitația n-a mers. Încearcă din nou." };
  }
  const p = await a.from("profiluri").insert({ id: data.user.id, nume, email, rol });
  if (p.error) {
    await a.auth.admin.deleteUser(data.user.id);
    return { ok: false, mesaj: "Invitația n-a mers. Încearcă din nou." };
  }
  revalidatePath("/echipa");
  return trimiteLink(email, nume, rol, data.properties.hashed_token, "invite");
}

/** Pentru cine n-a intrat încă: un link nou (cel vechi poate fi expirat). */
export async function retrimite(id: string): Promise<Rezultat> {
  if ((await eu()).rol !== "admin") return NU_E_ADMIN;
  const a = admin();
  const { data: p } = await a.from("profiluri").select("nume, email, rol").eq("id", id).maybeSingle();
  if (!p) return { ok: false, mesaj: "Omul nu mai există." };
  const { data, error } = await a.auth.admin.generateLink({ type: "recovery", email: p.email });
  if (error) return { ok: false, mesaj: "Linkul n-a putut fi făcut. Încearcă din nou." };
  return trimiteLink(p.email, p.nume, p.rol, data.properties.hashed_token, "recovery");
}

export async function schimbaRol(id: string, rol: Rol): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin") return NU_E_ADMIN;
  if (id === om.id) return { ok: false, mesaj: "Nu-ți poți schimba singur rolul." };
  if (!(ROLURI_ECHIPA as readonly Rol[]).includes(rol)) return { ok: false, mesaj: "Rolul ăsta nu se dă de aici." };
  const db = await supabase();
  const { data } = await db.from("profiluri").update({ rol }).eq("id", id).neq("rol", "admin").select("id");
  if (!data?.length) return { ok: false, mesaj: "Rolul n-a putut fi schimbat." };
  revalidatePath("/echipa");
  return { ok: true };
}

/** Oprit = nu mai vede nimic (RLS) și nu se mai poate conecta (ban în Supabase Auth). */
export async function seteazaActiv(id: string, activ: boolean): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin") return NU_E_ADMIN;
  if (id === om.id) return { ok: false, mesaj: "Nu-ți poți opri propriul cont." };
  const db = await supabase();
  const { data } = await db.from("profiluri").update({ activ }).eq("id", id).select("id");
  if (!data?.length) return { ok: false, mesaj: "Contul n-a putut fi schimbat." };
  const { error } = await admin().auth.admin.updateUserById(id, { ban_duration: activ ? "none" : "876000h" });
  if (error) {
    await db.from("profiluri").update({ activ: !activ }).eq("id", id);
    return { ok: false, mesaj: "Contul n-a putut fi schimbat. Încearcă din nou." };
  }
  revalidatePath("/echipa");
  return { ok: true };
}

/** „Mută tot la…”: lead-urile deschise și discuțiile viitoare (muta_lead_uri) sau, la un constructor, task-urile neterminate (muta_taskuri). */
export async function mutaTot(de: string, la: string): Promise<{ ok: true; mutate: number; mesaj: string } | { ok: false; mesaj: string }> {
  if ((await eu()).rol !== "admin") return NU_E_ADMIN as { ok: false; mesaj: string };
  if (!la) return { ok: false, mesaj: "Alege omul." };
  const db = await supabase();
  const { data: plecat } = await db.from("profiluri").select("rol").eq("id", de).maybeSingle();
  if (plecat?.rol === "constructor") {
    const t = await db.rpc("muta_taskuri", { de, la });
    if (t.error) return { ok: false, mesaj: mesajDinBaza(t.error, "Mutarea n-a mers.") };
    revalidatePath("/echipa");
    return { ok: true, mutate: t.data, mesaj: `Am mutat ${t.data === 1 ? "un task" : `${t.data} task-uri`}.` };
  }
  const { data, error } = await db.rpc("muta_lead_uri", { de, la });
  if (error) return { ok: false, mesaj: error.message || "Mutarea n-a mers." };
  const r = data as { lead_uri: number; discutii: number; discutii_ramase: number };
  let mesaj = `Am mutat ${lead(r.lead_uri)}.`;
  if (r.discutii) mesaj += ` Și ${r.discutii === 1 ? "o discuție programată" : `${r.discutii} discuții programate`}.`;
  if (r.discutii_ramase) mesaj += ` ${r.discutii_ramase === 1 ? "O discuție a rămas" : `${r.discutii_ramase} discuții au rămas`}: ora e ocupată la cel nou. Reprogramează din fișa lead-ului.`;
  revalidatePath("/echipa");
  return { ok: true, mutate: r.lead_uri, mesaj };
}
