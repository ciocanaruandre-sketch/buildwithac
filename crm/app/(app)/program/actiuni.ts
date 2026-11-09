"use server";

import { revalidatePath } from "next/cache";
import { eu } from "@/lib/eu";
import type { ZiProgram } from "@/lib/sloturi";
import { supabase } from "@/lib/supabase/server";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

/** Programul săptămânal: closerul pentru el, Adminul pentru oricine (verificat și în baza de date). */
export async function salveazaProgram(closerId: string, zile: ZiProgram[], durataMin: number): Promise<Rezultat> {
  await eu();
  for (const z of zile) {
    if (!/^\d{2}:\d{2}$/.test(z.de_la) || !/^\d{2}:\d{2}$/.test(z.pana_la) || z.de_la >= z.pana_la) {
      return { ok: false, mesaj: "La fiecare zi bifată, ora de început trebuie să fie înaintea celei de sfârșit." };
    }
  }
  const db = await supabase();
  const { error } = await db.rpc("salveaza_program", { p_closer: closerId, p_zile: zile, p_durata: durataMin });
  if (error) return { ok: false, mesaj: error.message || "Nu poți schimba programul ăsta." };
  revalidatePath("/program");
  return { ok: true };
}
