import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { CRM } from "@/lib/config";
import { escapa, trimiteEmail, type Email } from "@/lib/email";
import { FUS, ziuaRomaniei } from "@/lib/timp";
import { ETICHETE, type Stare } from "@/lib/tipuri";

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

export type LeadCareExpira = { id: string; nume: string; stare: Stare; intrat_la: string };

/** Ziua (în România) în care jobul de la 04:00 UTC șterge lead-ul. */
export function ziuaStergerii(intrat_la: string): string {
  const limita = new Date(new Date(intrat_la).getTime() + ZILE_PASTRARE * 86_400_000);
  const rulare = new Date(Date.UTC(limita.getUTCFullYear(), limita.getUTCMonth(), limita.getUTCDate(), 4));
  if (rulare < limita) rulare.setUTCDate(rulare.getUTCDate() + 1);
  return ziuaRomaniei(rulare);
}

/** E-mailul de luni, cu toate tabelele într-un JSON atașat și lead-urile care se șterg săptămâna asta. */
export function construiesteCopia(tabele: Record<string, unknown[]>, acum: Date, sterse: number, expira: LeadCareExpira[] = []): Omit<Email, "catre"> {
  const zi = ziuaRomaniei(acum);
  const nume = `crm-${zi}.json`;
  const json = JSON.stringify({ facuta_la: acum.toISOString(), tabele }, null, 1);
  const randuri = [
    `Copia de luni a CRM-ului e atașată (${nume}). Păstreaz-o într-un loc sigur: are datele oamenilor.`,
    ...(sterse ? [`Am șters ${lead(sterse)} mai vechi de ${ZILE_PASTRARE} de zile, cum promite pagina de confidențialitate.`] : []),
  ];
  const titlu = `Se șterg în următoarele 7 zile (${expira.length}). Dacă vreunul e încă în lucru, cere-i o confirmare nouă:`;
  const descriere = (l: LeadCareExpira) => `${l.nume} · ${ETICHETE.stare[l.stare]} · se șterge pe ${ziuaStergerii(l.intrat_la)}`;
  const link = (l: LeadCareExpira) => `${CRM.url}/lead-uri/${l.id}`;
  const lista = [titlu, ...expira.map((l) => `- ${descriere(l)}\n  ${link(l)}`)].join("\n");
  const text = [...randuri, ...(expira.length ? [lista] : [])].join("\n\n");
  const html = [
    ...randuri.map((r) => `<p>${escapa(r)}</p>`),
    ...(expira.length
      ? [`<p>${escapa(titlu)}</p>`, `<ul>${expira.map((l) => `<li><a href="${link(l)}">${escapa(descriere(l))}</a></li>`).join("")}</ul>`]
      : []),
  ].join("\n");
  return {
    subiect: `Copia CRM-ului, ${zi}`,
    text,
    html,
    atasamente: [{ nume, continut: Buffer.from(json, "utf8").toString("base64") }],
  };
}

/** Lead-urile care nu sunt „client” și se șterg în următoarele 7 zile. */
export async function careExpira(db: Db, acum: Date): Promise<LeadCareExpira[]> {
  const peste7 = new Date(acum.getTime() + 7 * 86_400_000);
  const { data, error } = await db
    .from("lead_uri")
    .select("id, nume, stare, intrat_la")
    .neq("stare", "client")
    .lt("intrat_la", dataLimita(peste7).toISOString())
    .order("intrat_la");
  if (error) throw error;
  return data;
}

/** Citește toate tabelele și le trimite lui Andrei. Fără cheie Resend sau la eroare întoarce false. */
export async function copieSaptamanala(db: Db, f: typeof fetch = fetch, o: { acum?: Date; sterse?: number } = {}): Promise<boolean> {
  const acum = o.acum ?? new Date();
  const tabele: Record<string, unknown[]> = {};
  for (const t of TABELE) tabele[t] = await citesteTot(db, t);
  return trimiteEmail({ catre: CRM.emailAdmin, ...construiesteCopia(tabele, acum, o.sterse ?? 0, await careExpira(db, acum)) }, f);
}
