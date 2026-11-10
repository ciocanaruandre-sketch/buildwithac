import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { BUCKET } from "@/lib/fisiere";

const PAGINA = 1000;
const ADANCIME = 3; // <proiect>/<uuid>/<fișier>; mai adânc nu se poate urca, dar golim și ce e mai sus de atât

type Db = SupabaseClient<Database>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Șterge tot ce e sub `dosar` (fișiere și subdosare). Întoarce false la prima eroare. */
async function golesteDosar(db: Db, dosar: string, adancime: number): Promise<boolean> {
  const bucket = db.storage.from(BUCKET);
  // câte o pagină pe tură, până se golește; plafonul oprește o buclă fără sfârșit dacă ceva nu dispare
  for (let tura = 0; tura < 100; tura++) {
    const { data, error } = await bucket.list(dosar, { limit: PAGINA });
    if (error) return false;
    if (!data?.length) return true;
    // în listă, un dosar are id null; un fișier are id
    const fisiere = data.filter((x) => x.id !== null).map((x) => `${dosar}/${x.name}`);
    const dosare = data.filter((x) => x.id === null).map((x) => `${dosar}/${x.name}`);
    if (fisiere.length && (await bucket.remove(fisiere)).error) return false;
    for (const d of dosare) {
      if (adancime <= 1 || !(await golesteDosar(db, d, adancime - 1))) return false;
    }
  }
  return false;
}

/**
 * Șterge tot ce e în dosarul unui proiect din bucket, inclusiv fișierele urcate și neconfirmate.
 * Rulează cu sesiunea celui care cheamă (regulile din Storage se aplică).
 * Întoarce false dacă ceva n-a putut fi citit sau șters.
 */
export async function stergeFisiereleProiectului(db: Db, proiectId: string): Promise<boolean> {
  if (!(await golesteDosar(db, proiectId, ADANCIME))) return false;
  // verificare: dacă a mai rămas ceva, spunem
  const { data: ramase, error } = await db.storage.from(BUCKET).list(proiectId, { limit: 1 });
  return !error && !(ramase ?? []).length;
}

/**
 * Pentru jobul zilnic, cu cheia de serviciu: golește dosarele din bucket ale proiectelor care nu mai există
 * (un fișier ajuns după „Șterge clientul”, sau o ștergere de fișiere care a picat). Întoarce câte dosare a golit.
 */
export async function curataFisiereOrfane(db: Db): Promise<number> {
  const bucket = db.storage.from(BUCKET);
  const dosare: string[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await bucket.list("", { limit: PAGINA, offset: de });
    if (error) throw error;
    dosare.push(...data.filter((x) => x.id === null && UUID.test(x.name)).map((x) => x.name));
    if (data.length < PAGINA) break;
  }
  if (!dosare.length) return 0;

  const exista = new Set<string>();
  for (let i = 0; i < dosare.length; i += 100) {
    const { data, error } = await db.from("proiecte").select("id").in("id", dosare.slice(i, i + 100));
    if (error) throw error;
    for (const p of data) exista.add(p.id);
  }

  let golite = 0;
  for (const d of dosare.filter((x) => !exista.has(x))) {
    if (!(await stergeFisiereleProiectului(db, d))) throw new Error(`dosarul ${d} n-a putut fi golit`);
    golite++;
  }
  return golite;
}
