import { SITE } from "@/lib/config";
import { trimiteCerere, verificaCerere } from "@/lib/contact";
import { trimiteLaCrm } from "@/lib/crm";
import { dinSite } from "@/lib/origine";

export async function POST(cerere: Request) {
  if (!dinSite(cerere)) return Response.json({ stare: "indisponibil" }, { status: 403 });
  const corp = await cerere.json().catch(() => null);
  // câmpul-capcană e ascuns: doar un robot îl completează; îi spunem „ok” ca să nu încerce altfel
  if (corp?.website) return Response.json({ stare: "ok" }, { status: 200 });
  const verificata = verificaCerere(corp);
  if ("greseli" in verificata) return Response.json({ stare: "invalid", camp: verificata.greseli[0] }, { status: 400 });

  // întâi CRM-ul (cel mult 4 s), ca e-mailul să aibă linkul la fișă sau avertismentul că lead-ul n-a intrat
  const secret = process.env.CRM_SECRET_INTRARE;
  const crm = secret ? await trimiteLaCrm(verificata.cerere, { url: process.env.CRM_URL || SITE.crm, secret }) : undefined;
  const stare = await trimiteCerere(verificata.cerere, { cheie: process.env.RESEND_API_KEY, crm });
  // lead-ul nu se pierde dacă a ajuns măcar într-un loc
  const ok = stare === "ok" || Boolean(crm);
  return Response.json({ stare: ok ? "ok" : "indisponibil" }, { status: ok ? 200 : 503 });
}
