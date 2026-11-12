import { eBazaDeTest } from "@/lib/echipa-test";
import type { Rol } from "@/lib/tipuri";

/** Cookie-ul modului filmare. Ține de browser, nu de cont: rămâne după „Ieși” și la intrarea cu alt cont. */
export const COOKIE_FILMARE = "crm_filmare";

/** Comutatorul: doar Admin, doar pe baza de test. */
export function aratComutatorFilmare(rol: Rol, urlBaza: string | undefined): boolean {
  return rol === "admin" && eBazaDeTest(urlBaza);
}

/** Modul filmare blurează datele personale doar pe CRM-ul demo (baza de test), niciodată pe producție. */
export function filmareActiva(valoareCookie: string | undefined, urlBaza: string | undefined): boolean {
  return valoareCookie === "1" && eBazaDeTest(urlBaza);
}
