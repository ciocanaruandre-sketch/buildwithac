import "server-only";
import { after } from "next/server";
import { golesteCoada } from "@/lib/calendar/coada";
import { admin } from "@/lib/supabase/admin";

/** După răspunsul către om: ce a pus acțiunea în coadă ajunge în Google. Omul nu așteaptă, iar o eroare nu strică acțiunea. */
export function sincronizeazaDupa(o?: { discutie?: string; limita?: number }): void {
  after(() => golesteCoada(admin(), fetch, o).catch((e) => console.error("calendar: sincronizarea", e)));
}
