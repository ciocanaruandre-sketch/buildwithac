"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eu } from "@/lib/eu";
import { trimiteNotificare } from "@/lib/notificare";
import { supabase } from "@/lib/supabase/server";
import { normalizeazaEmail, normalizeazaTelefon } from "@/lib/telefon";
import { SERVICII, SURSE_MANUALE, type Serviciu, type Sursa } from "@/lib/tipuri";

export type LeadDeMana = { nume: string; telefon?: string; email?: string; serviciu: Serviciu | ""; sursa: Sursa | ""; nota?: string; liber?: boolean };
export type RezultatLead = { ok: true; id: string } | { ok: false; mesaj: string; idExistent?: string };

const UNIC = "23505";

/**
 * Un lead adăugat de mână (după un cold call, o recomandare, un DM). Merge cu sesiunea omului,
 * deci RLS hotărăște cine are voie. Un telefon sau e-mail care există deja nu face un lead nou.
 */
export async function adaugaLead(d: LeadDeMana): Promise<RezultatLead> {
  const om = await eu();
  if (om.rol === "constructor") return { ok: false, mesaj: "Nu ai voie să adaugi lead-uri." };

  const nume = d.nume?.trim() ?? "";
  if (!nume) return { ok: false, mesaj: "Scrie numele." };
  const telefon = d.telefon?.trim() || null;
  const email = d.email?.trim() || null;
  const telefonNorm = telefon ? normalizeazaTelefon(telefon) : null;
  const emailNorm = email ? normalizeazaEmail(email) : null;
  if (!telefon && !email) return { ok: false, mesaj: "Scrie măcar telefonul sau e-mailul." };
  if (telefon && !telefonNorm) return { ok: false, mesaj: "Telefonul nu pare corect." };
  if (email && !emailNorm) return { ok: false, mesaj: "E-mailul nu pare corect." };
  const serviciu = z.enum(SERVICII).safeParse(d.serviciu);
  if (!serviciu.success) return { ok: false, mesaj: "Alege serviciul." };
  const sursa = z.enum(SURSE_MANUALE as [Sursa, ...Sursa[]]).safeParse(d.sursa);
  if (!sursa.success) return { ok: false, mesaj: "Alege sursa." };

  const db = await supabase();
  const { data, error } = await db
    .from("lead_uri")
    .insert({
      nume: nume.slice(0, 120),
      telefon,
      telefon_norm: telefonNorm,
      email,
      email_norm: emailNorm,
      serviciu: serviciu.data,
      sursa: sursa.data,
      caller_id: om.rol === "admin" && d.liber ? null : om.id,
      creat_de: om.id,
    })
    .select("id")
    .single();

  if (error?.code === UNIC) {
    for (const [col, val] of [["telefon_norm", telefonNorm], ["email_norm", emailNorm]] as const) {
      if (!val) continue;
      const { data: gasit } = await db.from("lead_uri").select("id").eq(col, val).maybeSingle();
      if (gasit) return { ok: false, mesaj: "Omul ăsta e deja în CRM.", idExistent: gasit.id };
    }
    return { ok: false, mesaj: "Omul ăsta e deja în CRM, la alt caller." };
  }
  if (error || !data) return { ok: false, mesaj: "Lead-ul n-a putut fi salvat. Încearcă din nou." };

  const nota = d.nota?.trim();
  if (nota) await db.from("notite").insert({ lead_id: data.id, autor_id: om.id, text: nota.slice(0, 5000) });

  // Andrei e anunțat când adaugă altcineva; când adaugă el, știe deja
  if (om.rol !== "admin") await trimiteNotificare({ id: data.id, nume, telefon, serviciu: serviciu.data, sursa: sursa.data }, "lead_nou");

  revalidatePath("/lead-uri");
  return { ok: true, id: data.id };
}
