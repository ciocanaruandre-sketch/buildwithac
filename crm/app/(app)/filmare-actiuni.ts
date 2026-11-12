"use server";

import { cookies } from "next/headers";
import { eu } from "@/lib/eu";
import { aratComutatorFilmare, COOKIE_FILMARE } from "@/lib/filmare";

/** Pornește sau oprește modul filmare în browserul acesta. Doar Admin, doar pe baza de test. */
export async function schimbaFilmare(): Promise<void> {
  const om = await eu();
  if (!aratComutatorFilmare(om.rol, process.env.NEXT_PUBLIC_SUPABASE_URL)) return;
  const borcan = await cookies();
  if (borcan.get(COOKIE_FILMARE)?.value === "1") borcan.delete(COOKIE_FILMARE);
  else borcan.set(COOKIE_FILMARE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
