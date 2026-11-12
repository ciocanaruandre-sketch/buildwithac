import "server-only";
import { cookies } from "next/headers";
import { COOKIE_FILMARE, filmareActiva } from "@/lib/filmare";

/** Modul filmare e pornit în browserul care cere pagina (și suntem pe baza de test). */
export async function inFilmare(): Promise<boolean> {
  const borcan = await cookies();
  return filmareActiva(borcan.get(COOKIE_FILMARE)?.value, process.env.NEXT_PUBLIC_SUPABASE_URL);
}
