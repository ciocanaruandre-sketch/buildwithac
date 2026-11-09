import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { CRM } from "@/lib/config";
import { escapa, trimiteEmail, type Email } from "@/lib/email";
import { FUS, ziuaRomaniei } from "@/lib/timp";

/** Promisiunea de pe site: cererile care nu ajung la colaborare se păstrează 90 de zile. */
export const ZILE_PASTRARE = 90;

/** Tabelele din copia de luni (fără `auth`). */
export const TABELE = ["profiluri", "lead_uri", "cereri", "notite", "evenimente", "clienti", "program_closer", "discutii"] as const;
type Tabel = (typeof TABELE)[number];

type Db = SupabaseClient<Database>;

export const dataLimita = (acum: Date): Date => new Date(acum.getTime() - ZILE_PASTRARE * 86_400_000);

const ZI_SAPTAMANA = new Intl.DateTimeFormat("en-US", { timeZone: FUS, weekday: "short" });
export const eLuni = (acum: Date): boolean => ZI_SAPTAMANA.format(acum) === "Mon";

/** Lead-urile care nu sunt „client” și au intrat de peste 90 de zile. Cererile, notițele, Parcursul și discuțiile pleacă prin „on delete cascade”. */
export async function stergeVechi(db: Db, acum: Date): Promise<number> {
  const { data, error } = await db.from("lead_uri").delete().neq("stare", "client").lt("intrat_la", dataLimita(acum).toISOString()).select("id");
  if (error) throw error;
  return data.length;
}

const PAGINA = 1000; // cât dă PostgREST dintr-o cerere

async function citesteTot(db: Db, tabel: Tabel): Promise<unknown[]> {
  const toate: unknown[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await db.from(tabel).select("*").order("id").range(de, de + PAGINA - 1);
    if (error) throw error;
    toate.push(...data);
    if (data.length < PAGINA) return toate;
  }
}

const lead = (n: number) => (n === 1 ? "1 lead" : `${n} lead-uri`);

/** E-mailul de luni, cu toate tabelele într-un JSON atașat. */
export function construiesteCopia(tabele: Record<string, unknown[]>, acum: Date, sterse: number): Omit<Email, "catre"> {
  const zi = ziuaRomaniei(acum);
  const nume = `crm-${zi}.json`;
  const json = JSON.stringify({ facuta_la: acum.toISOString(), tabele }, null, 1);
  const randuri = [
    `Copia de luni a CRM-ului e atașată (${nume}). Păstreaz-o într-un loc sigur: are datele oamenilor.`,
    ...(sterse ? [`Am șters ${lead(sterse)} mai vechi de ${ZILE_PASTRARE} de zile, cum promite pagina de confidențialitate.`] : []),
  ];
  return {
    subiect: `Copia CRM-ului, ${zi}`,
    text: randuri.join("\n\n"),
    html: randuri.map((r) => `<p>${escapa(r)}</p>`).join("\n"),
    atasamente: [{ nume, continut: Buffer.from(json, "utf8").toString("base64") }],
  };
}

/** Citește toate tabelele și le trimite lui Andrei. Fără cheie Resend sau la eroare întoarce false. */
export async function copieSaptamanala(db: Db, f: typeof fetch = fetch, o: { acum?: Date; sterse?: number } = {}): Promise<boolean> {
  const tabele: Record<string, unknown[]> = {};
  for (const t of TABELE) tabele[t] = await citesteTot(db, t);
  return trimiteEmail({ catre: CRM.emailAdmin, ...construiesteCopia(tabele, o.acum ?? new Date(), o.sterse ?? 0) }, f);
}
