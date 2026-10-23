import { aboneaza } from "@/lib/kit";

const COD = { ok: 200, invalid: 400, indisponibil: 503 } as const;

// browserul trimite mereu Origin la un POST din pagină; un script de pe alt site sau fără Origin nu ajunge la Kit
function dinSite(cerere: Request) {
  const origine = cerere.headers.get("origin");
  const gazda = cerere.headers.get("x-forwarded-host") ?? cerere.headers.get("host");
  if (!origine || !gazda) return false;
  try { return new URL(origine).host === gazda; } catch { return false; }
}

export async function POST(cerere: Request) {
  if (!dinSite(cerere)) return Response.json({ stare: "indisponibil" }, { status: 403 });
  const corp = await cerere.json().catch(() => ({}));
  // câmpul-capcană e ascuns: doar un robot îl completează; îi spunem „ok” ca să nu încerce altfel
  if (corp?.website) return Response.json({ stare: "ok" }, { status: 200 });
  const stare = await aboneaza(String(corp?.email ?? ""), { cheie: process.env.KIT_API_KEY, formular: process.env.KIT_FORM_ID });
  return Response.json({ stare }, { status: COD[stare] });
}
