import { timingSafeEqual } from "node:crypto";
import { trimiteAlerteIntarziere } from "@/lib/alerte-finante";
import { curataFisiereOrfane } from "@/lib/fisiere-bucket";
import { copieSaptamanala, eLuni, stergeVechi } from "@/lib/retentie";
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
 * Jobul zilnic din vercel.json: șterge lead-urile mai vechi de 90 de zile (cererea la Supabase îl ține și treaz),
 * face tranșele de mentenanță ale lunii următoare, anunță tranșele întârziate, iar lunea îi trimite lui Andrei copia datelor.
 */
export async function GET(cerere: Request) {
  if (!autorizat(cerere)) return Response.json({ eroare: "neautorizat" }, { status: 401 });
  const acum = new Date();
  const db = admin();
  try {
    const sterse = await stergeVechi(db, acum);
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
    const copie = eLuni(acum) ? await copieSaptamanala(db, fetch, { acum, sterse }) : null;
    if (copie === false) console.error("cron zilnic: copia de luni n-a plecat");
    return Response.json({ sterse, orfane, mentenanta, alerte, copie });
  } catch (e) {
    console.error("cron zilnic:", e);
    return Response.json({ eroare: "baza" }, { status: 500 });
  }
}
