import { timingSafeEqual } from "node:crypto";
import { trimiteAlerteIntarziere } from "@/lib/alerte-finante";
import { golesteCoada } from "@/lib/calendar/coada";
import { curataFisiereOrfane } from "@/lib/fisiere-bucket";
import { anonimizeazaVechi, copieSaptamanala, eLuni } from "@/lib/retentie";
import { admin } from "@/lib/supabase/admin";
import { ziuaPeste } from "@/lib/timp";

export const maxDuration = 60;

function autorizat(cerere: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(cerere.headers.get("authorization") ?? "");
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Jobul zilnic din vercel.json: lasă fără nume lead-urile mai vechi de un an (cererea la Supabase îl ține și treaz),
 * face tranșele de mentenanță ale lunii următoare, anunță tranșele întârziate, iar lunea îi trimite lui Andrei copia datelor.
 */
export async function GET(cerere: Request) {
  if (!autorizat(cerere)) return Response.json({ eroare: "neautorizat" }, { status: 401 });
  const acum = new Date();
  const db = admin();
  try {
    const anonimizate = await anonimizeazaVechi(db);
    // ce a rămas în coada calendarului (inclusiv ștergerile din Google ale lead-urilor anonimizate acum)
    const calendar = await golesteCoada(db, fetch, { limita: 200 }).catch((e) => {
      console.error("cron zilnic: calendarul", e);
      return null;
    });
    // fișierele rămase de la clienții șterși; o eroare aici nu oprește copia de luni
    const orfane = await curataFisiereOrfane(db).catch((e) => {
      console.error("cron zilnic: fișierele orfane", e);
      return null;
    });
    // tranșele de mentenanță ale lunii următoare, cu ~35 de zile înainte; o eroare aici nu oprește restul
    const mentenanta = await db.rpc("genereaza_mentenanta", { pana: ziuaPeste(acum, 35) }).then(
      (r) => {
        if (r.error) console.error("cron zilnic: mentenanța", r.error);
        return r.data ?? null;
      },
    );
    // e-mailul cu tranșele întârziate încă neanunțate; o eroare aici nu oprește copia de luni
    const alerte = await trimiteAlerteIntarziere(db, fetch, acum).catch((e) => {
      console.error("cron zilnic: alertele de întârziere", e);
      return null;
    });
    const copie = eLuni(acum) ? await copieSaptamanala(db, fetch, { acum, anonimizate }) : null;
    if (copie === false) console.error("cron zilnic: copia de luni n-a plecat");
    return Response.json({ anonimizate, calendar, orfane, mentenanta, alerte, copie });
  } catch (e) {
    console.error("cron zilnic:", e);
    return Response.json({ eroare: "baza" }, { status: 500 });
  }
}
