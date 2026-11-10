import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { BUCKET } from "@/lib/fisiere";

const PAGINA = 1000;

/**
 * Șterge tot ce e în dosarul unui proiect din bucket (<proiect>/<uuid>/<fișier>), inclusiv fișierele
 * urcate și neconfirmate. Rulează cu sesiunea celui care cheamă (regulile din Storage se aplică).
 * Întoarce false dacă ceva n-a putut fi citit sau șters; atunci clientul nu se șterge.
 */
export async function stergeFisiereleProiectului(db: SupabaseClient<Database>, proiectId: string): Promise<boolean> {
  const bucket = db.storage.from(BUCKET);
  const { data: dosare, error } = await bucket.list(proiectId, { limit: PAGINA });
  if (error) return false;
  for (const dosar of dosare ?? []) {
    const cale = `${proiectId}/${dosar.name}`;
    const { data: fisiere, error: e } = await bucket.list(cale, { limit: PAGINA });
    if (e) return false;
    if (!fisiere?.length) continue;
    const sters = await bucket.remove(fisiere.map((f) => `${cale}/${f.name}`));
    if (sters.error) return false;
  }
  // verificare: dacă a mai rămas ceva (o regulă a ascuns un fișier), nu mergem mai departe
  const { data: ramase, error: e2 } = await bucket.list(proiectId, { limit: 1 });
  return !e2 && !(ramase ?? []).length;
}
