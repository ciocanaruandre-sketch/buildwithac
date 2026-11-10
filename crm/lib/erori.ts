/** Codul cu care ajung mesajele noastre din trigger-e („raise exception” simplu), scrise în română. */
const MESAJ_AL_NOSTRU = "P0001";

/**
 * Ce i se arată omului când baza de date refuză ceva. Doar mesajele noastre trec;
 * erorile brute Postgres (în engleză, cu nume de tabele) rămân ascunse în spatele mesajului implicit.
 */
export function mesajDinBaza(e: { code?: string; message: string } | null, implicit: string): string {
  return e?.code === MESAJ_AL_NOSTRU && e.message ? e.message : implicit;
}
