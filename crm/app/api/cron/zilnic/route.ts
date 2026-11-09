import { timingSafeEqual } from "node:crypto";
import { copieSaptamanala, eLuni, stergeVechi } from "@/lib/retentie";
import { admin } from "@/lib/supabase/admin";

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
 * iar lunea îi trimite lui Andrei copia datelor.
 */
export async function GET(cerere: Request) {
  if (!autorizat(cerere)) return Response.json({ eroare: "neautorizat" }, { status: 401 });
  const acum = new Date();
  const db = admin();
  try {
    const sterse = await stergeVechi(db, acum);
    const copie = eLuni(acum) ? await copieSaptamanala(db, fetch, { acum, sterse }) : null;
    if (copie === false) console.error("cron zilnic: copia de luni n-a plecat");
    return Response.json({ sterse, copie });
  } catch (e) {
    console.error("cron zilnic:", e);
    return Response.json({ eroare: "baza" }, { status: 500 });
  }
}
