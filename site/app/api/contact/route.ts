import { trimiteCerere, verificaCerere } from "@/lib/contact";
import { dinSite } from "@/lib/origine";

export async function POST(cerere: Request) {
  if (!dinSite(cerere)) return Response.json({ stare: "indisponibil" }, { status: 403 });
  const corp = await cerere.json().catch(() => null);
  // câmpul-capcană e ascuns: doar un robot îl completează; îi spunem „ok” ca să nu încerce altfel
  if (corp?.website) return Response.json({ stare: "ok" }, { status: 200 });
  const verificata = verificaCerere(corp);
  if ("greseli" in verificata) return Response.json({ stare: "invalid", camp: verificata.greseli[0] }, { status: 400 });
  const stare = await trimiteCerere(verificata.cerere, { cheie: process.env.RESEND_API_KEY });
  return Response.json({ stare }, { status: stare === "ok" ? 200 : 503 });
}
