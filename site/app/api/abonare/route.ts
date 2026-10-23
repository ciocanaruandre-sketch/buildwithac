import { aboneaza } from "@/lib/kit";

const COD = { ok: 200, invalid: 400, indisponibil: 503 } as const;

export async function POST(cerere: Request) {
  const corp = await cerere.json().catch(() => ({}));
  const stare = await aboneaza(String(corp?.email ?? ""), { cheie: process.env.KIT_API_KEY, formular: process.env.KIT_FORM_ID });
  return Response.json({ stare }, { status: COD[stare] });
}
