import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabase } from "@/lib/supabase/server";
import type { Rol } from "@/lib/tipuri";

export type Eu = { id: string; nume: string; rol: Rol };

/** Omul conectat. Fără sesiune → /intra; cont oprit sau fără profil → deconectat, cu mesaj. */
export const eu = cache(async (): Promise<Eu> => {
  const db = await supabase();
  const { data } = await db.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/intra");
  // RLS ascunde profilurile de un cont inactiv: dacă nu-l găsim, contul e oprit
  const { data: p } = await db.from("profiluri").select("id, nume, rol").eq("id", id).maybeSingle();
  if (!p) redirect("/auth/oprit");
  return p;
});

/** Doar pentru paginile unor roluri; ceilalți ajung la pagina lor. */
export async function cerRol(...roluri: Rol[]): Promise<Eu> {
  const om = await eu();
  if (!roluri.includes(om.rol)) redirect(om.rol === "constructor" ? "/clienti" : "/lead-uri");
  return om;
}
