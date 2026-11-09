import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";
import { decide, type Decizie } from "@/lib/decizie";
import type { CerereNoua } from "@/lib/intrare-tipuri";
import { normalizeazaEmail, normalizeazaTelefon } from "@/lib/telefon";

export type { CerereNoua } from "@/lib/intrare-tipuri";
export type Rezultat = { id: string; decizie: Decizie | "duplicat" };

type Db = SupabaseClient<Database>;
const UNIC = "23505";

class FaraContact extends Error {}

async function cauta(db: Db, telefonNorm: string | null, emailNorm: string | null) {
  for (const [col, val] of [["telefon_norm", telefonNorm], ["email_norm", emailNorm]] as const) {
    if (!val) continue;
    const { data, error } = await db.from("lead_uri").select("id, stare").eq(col, val).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

/**
 * O cerere dintr-un formular intră în CRM (cu cheia de serviciu): același om nu se dublează.
 * Lead deschis → cererea se leagă de el; client → la fel, iar Andrei e anunțat; pierdut/descalificat → se redeschide.
 */
export async function primesteCerere(c: CerereNoua, db: Db): Promise<Rezultat> {
  if (c.idExtern) {
    const { data } = await db.from("cereri").select("lead_id").eq("id_extern", c.idExtern).maybeSingle();
    if (data) return { id: data.lead_id, decizie: "duplicat" };
  }
  const telefonNorm = c.telefon ? normalizeazaTelefon(c.telefon) : null;
  const emailNorm = normalizeazaEmail(c.email);
  if (!telefonNorm && !emailNorm) throw new FaraContact("Cererea n-are nici telefon, nici e-mail valid.");

  for (let incercare = 0; incercare < 2; incercare++) {
    const gasit = await cauta(db, telefonNorm, emailNorm);
    const decizie = decide(gasit);
    let id: string;

    if (!gasit) {
      const { data, error } = await db
        .from("lead_uri")
        .insert({ nume: c.nume.slice(0, 120), telefon: c.telefon, telefon_norm: telefonNorm, email: c.email, email_norm: emailNorm, serviciu: c.serviciu, sursa: c.sursa })
        .select("id")
        .single();
      // trimis de două ori în aceeași clipă: celălalt a câștigat, căutăm din nou
      if (error?.code === UNIC && incercare === 0) continue;
      if (error) throw error;
      id = data.id;
    } else {
      id = gasit.id;
    }

    const cer = await db.from("cereri").insert({ lead_id: id, sursa: c.sursa, id_extern: c.idExtern, raspunsuri: c.raspunsuri, utm: c.utm });
    if (cer.error?.code === UNIC) return { id, decizie: "duplicat" };
    if (cer.error) throw cer.error;

    if (decizie === "redeschide") {
      const { error } = await db.from("lead_uri").update({ stare: "nou", intrat_la: new Date().toISOString(), motiv: null, callback_la: null }).eq("id", id);
      if (error) throw error;
    }
    if (decizie !== "lead_nou") {
      const tip = decizie === "redeschide" ? "redeschis" : "cerere_noua";
      const { error } = await db.from("evenimente").insert({ lead_id: id, tip, detalii: { sursa: c.sursa } });
      if (error) throw error;
    }
    return { id, decizie };
  }
  throw new Error("Lead-ul n-a putut fi scris după două încercări.");
}

export const eFaraContact = (e: unknown) => e instanceof FaraContact;
