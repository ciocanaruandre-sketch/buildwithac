"use server";

import { revalidatePath } from "next/cache";
import type { Rezultat } from "@/app/(app)/clienti/[id]/actiuni-finante";
import { eu } from "@/lib/eu";
import { mesajDinBaza } from "@/lib/erori";
import { citesteProcent } from "@/lib/proiecte";
import { supabase } from "@/lib/supabase/server";
import { ziuaRomaniei } from "@/lib/timp";
import type { Rol } from "@/lib/tipuri";

const NEPERMIS = "Nu ai voie să faci asta.";
const UUID = /^[0-9a-f-]{36}$/;
const CATEGORII = ["site", "automatizari", "1la1", "altceva", "mentenanta"] as const;
const ROLURI_CU_PROCENT: Rol[] = ["caller", "closer", "constructor"];

/** Doar Adminul: toate comisioanele neplătite ale omului devin plătite azi (minusurile se scad din ele). */
export async function platesteTot(omId: string): Promise<Rezultat> {
  const om = await eu();
  if (om.rol !== "admin" || !UUID.test(omId)) return { ok: false, mesaj: NEPERMIS };
  const db = await supabase();
  const { error } = await db.rpc("plateste_tot", { om: omId, zi: ziuaRomaniei(new Date()) });
  if (error) return { ok: false, mesaj: mesajDinBaza(error, "Nu s-a salvat. Încearcă din nou.") };
  revalidatePath("/finante");
  return { ok: true };
}

/** Doar Adminul: procentul de bază al unui serviciu pentru un rol. Gol = nestabilit. */
export async function schimbaProcentBaza(categorie: string, rol: Rol, procent: string): Promise<Rezultat> {
  const om = await eu();
  const cat = CATEGORII.find((c) => c === categorie);
  if (om.rol !== "admin" || !cat || !ROLURI_CU_PROCENT.includes(rol)) return { ok: false, mesaj: NEPERMIS };
  const p = citesteProcent(procent);
  if (p === "gresit") return { ok: false, mesaj: "Procentul e între 0 și 100." };
  const db = await supabase();
  const { data, error } = await db.from("procente_baza").update({ procent: p }).eq("categorie", cat).eq("rol", rol).select("rol");
  if (error) return { ok: false, mesaj: mesajDinBaza(error, "Nu s-a salvat. Încearcă din nou.") };
  if (!data.length) return { ok: false, mesaj: NEPERMIS };
  revalidatePath("/finante");
  return { ok: true };
}
