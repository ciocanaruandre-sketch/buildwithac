import type { Rol } from "@/lib/tipuri";

/** Cheile conturilor de test (aceleași ca înainte, ca testele să nu se schimbe). */
export type ContTest = "admin" | "caller" | "caller2" | "closer" | "constructor";

/** Ref-ul proiectului Supabase de test. Scripturile de date nu scriu nicăieri altundeva. */
export const REF_TEST = "sglkjcwsohzszktljacv";

/**
 * Echipa de test, care e și echipa demo (pozele, clipurile). Adresele n-au căsuță:
 * niciun e-mail nu pleacă spre ele. `emailVechi` = adresa de dinainte, ca seed-ul să mute contul.
 */
export const ECHIPA_TEST: Record<ContTest, { email: string; nume: string; rol: Rol; emailVechi: string }> = {
  admin: { email: "andrei@buildwithac.ro", nume: "Andrei Ciocănaru", rol: "admin", emailVechi: "admin@test.buildwithac.ro" },
  caller: { email: "mara@buildwithac.ro", nume: "Mara Ionescu", rol: "caller", emailVechi: "caller@test.buildwithac.ro" },
  caller2: { email: "vlad@buildwithac.ro", nume: "Vlad Petrescu", rol: "caller", emailVechi: "caller2@test.buildwithac.ro" },
  closer: { email: "ioana@buildwithac.ro", nume: "Ioana Dumitru", rol: "closer", emailVechi: "closer@test.buildwithac.ro" },
  constructor: { email: "radu@buildwithac.ro", nume: "Radu Stan", rol: "constructor", emailVechi: "constructor@test.buildwithac.ro" },
};

/** Adevărat doar pentru adresa exactă a bazei de test (cu sau fără „/” la final). */
export function eBazaDeTest(url: string | undefined): boolean {
  if (!url) return false;
  return url.replace(/\/$/, "") === `https://${REF_TEST}.supabase.co`;
}

/**
 * Adresele spre care nu trimitem e-mailuri: orice `@test.buildwithac.ro`, oriunde,
 * și adresele echipei demo, dar acestea doar pe baza de test (pe producție pot fi oameni adevărați).
 */
export function eAdresaFaraCasuta(email: string, urlBaza = process.env.NEXT_PUBLIC_SUPABASE_URL): boolean {
  const e = email.trim().toLowerCase();
  if (e.endsWith("@test.buildwithac.ro")) return true;
  return eBazaDeTest(urlBaza) && Object.values(ECHIPA_TEST).some((c) => c.email === e);
}
