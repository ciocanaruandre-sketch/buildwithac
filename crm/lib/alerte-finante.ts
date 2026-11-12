import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { CRM } from "@/lib/config";
import { escapa, trimiteEmail, type Email } from "@/lib/email";
import { textZile } from "@/lib/finante";
import { lei, zileIntarziere } from "@/lib/proiecte";
import { ziuaRomaniei } from "@/lib/timp";

type Db = SupabaseClient<Database>;

export type TransaIntarziata = { transaId: string; clientId: string; proiectId: string; client: string; eticheta: string; suma_lei: number; scadenta: string };

export const linkTransa = (t: TransaIntarziata) => `${CRM.url}/clienti/${t.clientId}?proiect=${t.proiectId}`;
export const descriereTransa = (t: TransaIntarziata, azi: string) => `${t.client} · ${t.eticheta} · ${lei(t.suma_lei)} · ${textZile(zileIntarziere(t.scadenta, azi))}`;

/** Un singur e-mail cu toate tranșele întârziate, fiecare cu link la fișa clientului. */
export function construiesteAlerta(t: TransaIntarziata[], azi: string): Omit<Email, "catre"> {
  const subiect = t.length === 1 ? "Întârzie o tranșă" : `Întârzie ${t.length} tranșe`;
  const intro = t.length === 1 ? "O tranșă a trecut de scadență și n-ai bifat-o ca încasată:" : `${t.length} tranșe au trecut de scadență și nu sunt bifate ca încasate:`;
  const final = "Dacă banii au intrat, bifează „Am încasat” pe fișă. Dacă nu, scrie-i clientului.";
  return {
    subiect,
    text: [intro, ...t.map((x) => `- ${descriereTransa(x, azi)}\n  ${linkTransa(x)}`), "", final].join("\n"),
    html: [
      `<p>${escapa(intro)}</p>`,
      `<ul>${t.map((x) => `<li><a href="${linkTransa(x)}">${escapa(descriereTransa(x, azi))}</a></li>`).join("")}</ul>`,
      `<p>${escapa(final)}</p>`,
    ].join("\n"),
  };
}

/** Tranșele neîncasate cu scadența trecută (cele mai vechi întâi); `doarNetrimise`: doar cele fără alertă trimisă. */
export async function transeIntarziate(db: Db, azi: string, doarNetrimise: boolean): Promise<TransaIntarziata[]> {
  let cerere = db
    .from("transe")
    .select("id, proiect_id, eticheta, suma_lei, scadenta, proiecte (client_id, clienti (nume))")
    .is("incasata_la", null)
    .lt("scadenta", azi);
  if (doarNetrimise) cerere = cerere.is("alerta_trimisa_la", null);
  const { data, error } = await cerere.order("scadenta");
  if (error) throw error;
  return data.map((t) => ({
    transaId: t.id,
    clientId: t.proiecte?.client_id ?? "",
    proiectId: t.proiect_id,
    client: t.proiecte?.clienti?.nume ?? "client șters",
    eticheta: t.eticheta,
    suma_lei: t.suma_lei,
    scadenta: t.scadenta,
  }));
}

/** Jobul zilnic: un e-mail cu tranșele întârziate încă neanunțate. Le marchează doar după ce e-mailul a plecat. Întoarce câte a anunțat. */
export async function trimiteAlerteIntarziere(db: Db, f: typeof fetch, acum: Date): Promise<number> {
  const azi = ziuaRomaniei(acum);
  const t = await transeIntarziate(db, azi, true);
  if (!t.length) return 0;
  if (!(await trimiteEmail({ catre: CRM.emailAdmin, ...construiesteAlerta(t, azi) }, f))) return 0;
  const { error } = await db
    .from("transe")
    .update({ alerta_trimisa_la: acum.toISOString() })
    .in("id", t.map((x) => x.transaId));
  if (error) throw error;
  return t.length;
}
