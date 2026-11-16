import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { decripteaza } from "@/lib/calendar/criptare";
import { corpEveniment } from "@/lib/calendar/eveniment";
import { GoogleCazut, idEveniment, ocupat, revoca, scrieEveniment, stergeEveniment, tokenAcces, type Interval } from "@/lib/calendar/google";

// Golirea cozii calendarului: ce au pus trigger-ele din baza de date ajunge în Google.
// Rulează doar cu cheia de serviciu (admin()): tabelele cheilor și ale cozii n-au drepturi pentru utilizatori.

type Db = SupabaseClient<Database>;
type Rand = Database["public"]["Tables"]["calendar_coada"]["Row"];
type Acces = { tip: "ok"; acces: string } | { tip: "neconectat" } | { tip: "cazut" } | { tip: "eroare"; eroare: unknown };

/** Cheile se decriptează și se schimbă pe o cheie de acces o singură dată pe om, într-o golire. */
function cheiDeAcces(db: Db, f: typeof fetch) {
  const memorie = new Map<string, Promise<Acces>>();
  const ia = async (om: string): Promise<Acces> => {
    const { data, error } = await db.from("google_conexiuni").select("refresh_criptat, stare").eq("om_id", om).maybeSingle();
    if (error) return { tip: "eroare", eroare: error };
    if (!data) return { tip: "neconectat" };
    if (data.stare === "cazut") return { tip: "cazut" };
    try {
      return { tip: "ok", acces: await tokenAcces(decripteaza(data.refresh_criptat), f) };
    } catch (e) {
      if (e instanceof GoogleCazut) {
        await db.from("google_conexiuni").update({ stare: "cazut" }).eq("om_id", om);
        return { tip: "cazut" };
      }
      return { tip: "eroare", eroare: e };
    }
  };
  return {
    pentru(om: string) {
      let p = memorie.get(om);
      if (!p) memorie.set(om, (p = ia(om)));
      return p;
    },
    async cade(om: string) {
      memorie.set(om, Promise.resolve({ tip: "cazut" }));
      await db.from("google_conexiuni").update({ stare: "cazut" }).eq("om_id", om);
    },
  };
}

/** Scoate rândul doar dacă nu l-a re-armat cineva între timp (versiunea e tot cea luată). */
async function scoate(db: Db, r: Rand) {
  await db.from("calendar_coada").delete().eq("id", r.id).eq("versiune", r.versiune);
}

class LegaturaCazuta extends Error {}

async function faScrie(db: Db, r: Rand, chei: ReturnType<typeof cheiDeAcces>, f: typeof fetch) {
  const { data: d, error } = await db
    .from("discutii")
    .select("id, lead_id, closer_id, incepe_la, sfarseste_la, google_event_id, google_om_id, lead_uri(nume, telefon, serviciu, anonimizat_la)")
    .eq("id", r.discutie_id!)
    .maybeSingle();
  if (error) throw error;
  if (!d || !d.lead_uri || d.lead_uri.anonimizat_la) return scoate(db, r);

  const a = await chei.pentru(d.closer_id);
  if (a.tip === "neconectat") {
    await db.from("discutii").update({ calendar_stare: "neconectat" }).eq("id", d.id).eq("closer_id", d.closer_id);
    return scoate(db, r);
  }
  if (a.tip === "cazut") throw new LegaturaCazuta("Legătura cu Google Calendar a căzut.");
  if (a.tip === "eroare") throw a.eroare;

  let eventId = d.google_event_id;
  if (eventId && d.google_om_id && d.google_om_id !== d.closer_id) {
    // evenimentul e în calendarul altcuiva: se șterge acolo, aici se face unul nou
    await db.from("calendar_coada").insert({ actiune: "sterge", om_id: d.google_om_id, event_id: eventId });
    eventId = null;
  }
  const corp = corpEveniment({
    leadId: d.lead_id,
    nume: d.lead_uri.nume,
    telefon: d.lead_uri.telefon,
    serviciu: d.lead_uri.serviciu,
    incepe: d.incepe_la,
    sfarseste: d.sfarseste_la,
  });
  let id: string;
  try {
    id = await scrieEveniment(a.acces, corp, eventId, f, idEveniment(d.id));
  } catch (e) {
    if (e instanceof GoogleCazut) await chei.cade(d.closer_id);
    throw e;
  }
  const { data: puse } = await db
    .from("discutii")
    .update({ google_event_id: id, google_om_id: d.closer_id, calendar_stare: "ok" })
    .eq("id", d.id)
    .eq("closer_id", d.closer_id)
    .select("id");
  if (!puse?.length) {
    // discuția a fost ștearsă sau mutată la alt closer cât lucra Google: evenimentul nu mai are ce căuta aici
    await stergeEveniment(a.acces, id, f).catch(() => undefined);
  }
  await scoate(db, r);
}

async function faSterge(db: Db, r: Rand, chei: ReturnType<typeof cheiDeAcces>, f: typeof fetch) {
  const a = await chei.pentru(r.om_id!);
  if (a.tip === "neconectat") return scoate(db, r); // la deconectare s-au șters deja toate
  if (a.tip === "cazut") throw new LegaturaCazuta("Legătura cu Google Calendar a căzut.");
  if (a.tip === "eroare") throw a.eroare;
  try {
    await stergeEveniment(a.acces, r.event_id!, f);
  } catch (e) {
    if (e instanceof GoogleCazut) await chei.cade(r.om_id!);
    throw e;
  }
  await scoate(db, r);
}

export async function golesteCoada(
  db: Db,
  f: typeof fetch = fetch,
  o: { discutie?: string; om?: string; limita?: number; pana?: number } = {},
): Promise<{ facute: number; esuate: number }> {
  const { data: randuri, error } = await db.rpc("calendar_ia_din_coada", {
    limita: o.limita ?? 20,
    p_discutie: o.discutie,
    p_om: o.om,
  });
  if (error) throw error;
  const chei = cheiDeAcces(db, f);
  let facute = 0;
  let esuate = 0;
  for (const [i, r] of (randuri ?? []).entries()) {
    // termenul (jobul zilnic are timp limitat): ce n-a apucat rămâne liber pentru data viitoare
    if (o.pana !== undefined && Date.now() >= o.pana) {
      const ramase = (randuri ?? []).slice(i).map((x) => x.id);
      await db.from("calendar_coada").update({ luat_la: null }).in("id", ramase);
      break;
    }
    try {
      if (r.actiune === "scrie") await faScrie(db, r, chei, f);
      else await faSterge(db, r, chei, f);
      facute++;
    } catch (e) {
      esuate++;
      const cazut = e instanceof LegaturaCazuta;
      // la legătura căzută rândul se ia din nou abia peste 2 minute (după reconectare intră singur)
      await db
        .from("calendar_coada")
        .update({ incercari: r.incercari + 1, ultima_eroare: String((e as Error)?.message ?? e).slice(0, 500), luat_la: cazut ? new Date().toISOString() : null })
        .eq("id", r.id)
        .eq("versiune", r.versiune);
      if (r.actiune === "scrie") await db.from("discutii").update({ calendar_stare: "eroare" }).eq("id", r.discutie_id!);
    }
  }
  return { facute, esuate };
}

/**
 * Scoate din calendarul omului tot ce a pus CRM-ul (și evenimentele trecute), apoi uită și retrage cheia.
 * Ce n-a putut fi șters se numără; deconectarea se face oricum.
 */
export async function deconecteaza(db: Db, omId: string, f: typeof fetch = fetch): Promise<{ nesterse: number }> {
  await golesteCoada(db, f, { om: omId, limita: 200 }).catch((e) => console.error("calendar: deconectare, coada", e));

  const { data: con } = await db.from("google_conexiuni").select("refresh_criptat").eq("om_id", omId).maybeSingle();
  const { data: puse } = await db.from("discutii").select("id, google_event_id").eq("google_om_id", omId).not("google_event_id", "is", null);
  const { data: ramase } = await db.from("calendar_coada").select("id, event_id").eq("actiune", "sterge").eq("om_id", omId);
  const deSters = [...(puse ?? []).map((d) => d.google_event_id!), ...(ramase ?? []).map((r) => r.event_id!)];

  let nesterse = 0;
  let refresh: string | null = null;
  if (con) {
    let acces: string | null = null;
    try {
      refresh = decripteaza(con.refresh_criptat);
      acces = await tokenAcces(refresh, f);
    } catch (e) {
      console.error("calendar: deconectare, cheia", e);
    }
    for (const ev of deSters) {
      if (!acces) {
        nesterse++;
        continue;
      }
      try {
        await stergeEveniment(acces, ev, f);
      } catch {
        nesterse++;
      }
    }
  }

  await db.from("discutii").update({ google_event_id: null, google_om_id: null }).eq("google_om_id", omId);
  await db.from("discutii").update({ calendar_stare: "neconectat" }).eq("closer_id", omId).gt("incepe_la", new Date().toISOString());
  await db.from("calendar_coada").delete().eq("actiune", "sterge").eq("om_id", omId);
  if (refresh) await revoca(refresh, f);
  await db.from("google_conexiuni").delete().eq("om_id", omId);
  return { nesterse };
}

export type OcupatGoogle = { stare: "ok"; ocupate: Interval[] } | { stare: "neconectat" | "nu_pot" };

/** Orele ocupate din Google Calendar-ul omului. Nu aruncă: la orice problemă sau după 3 secunde, „nu_pot”. */
export async function ocupatGoogle(db: Db, omId: string, de: Date, pana: Date, f: typeof fetch = fetch): Promise<OcupatGoogle> {
  const lucru = (async (): Promise<OcupatGoogle> => {
    const { data, error } = await db.from("google_conexiuni").select("refresh_criptat, stare").eq("om_id", omId).maybeSingle();
    if (error) return { stare: "nu_pot" };
    if (!data) return { stare: "neconectat" };
    if (data.stare === "cazut") return { stare: "nu_pot" };
    try {
      const acces = await tokenAcces(decripteaza(data.refresh_criptat), f);
      return { stare: "ok", ocupate: await ocupat(acces, de, pana, f) };
    } catch (e) {
      if (e instanceof GoogleCazut) await db.from("google_conexiuni").update({ stare: "cazut" }).eq("om_id", omId);
      return { stare: "nu_pot" };
    }
  })();
  let ceas: ReturnType<typeof setTimeout> | undefined;
  const limita = new Promise<OcupatGoogle>((rez) => {
    ceas = setTimeout(() => rez({ stare: "nu_pot" }), 3_000);
  });
  try {
    return await Promise.race([lucru, limita]);
  } finally {
    clearTimeout(ceas);
  }
}

export type StareRand = "ok" | "eroare" | "neconectat";

/**
 * Rândul „Google Calendar” de sub discuție, pe fișă. Cât e în așteptare, nu arată nimic 2 minute de la ultima
 * punere în coadă; după aceea, „eroare” („N-a ajuns în calendar”). O discuție fără loc în coadă (programată
 * înainte de calendar) e pusă acum în coadă, ca să nu rămână roșie la nesfârșit.
 */
export async function stareRand(db: Db, d: { id: string; calendar_stare: string | null; creat_la: string }, acum: Date): Promise<StareRand | null> {
  if (d.calendar_stare === "ok" || d.calendar_stare === "eroare" || d.calendar_stare === "neconectat") return d.calendar_stare;
  const { data: rand } = await db.from("calendar_coada").select("creat_la").eq("actiune", "scrie").eq("discutie_id", d.id).maybeSingle();
  if (!rand) {
    // un „scrie” pus între timp de altcineva lovește indexul unic: e tot ce ne trebuie
    await db.from("calendar_coada").insert({ actiune: "scrie", discutie_id: d.id });
    return null;
  }
  return acum.getTime() - new Date(rand.creat_la).getTime() > 2 * 60_000 ? "eroare" : null;
}
