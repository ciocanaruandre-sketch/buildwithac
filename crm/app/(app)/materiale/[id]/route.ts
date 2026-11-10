import { eu } from "@/lib/eu";
import { BUCKET, desfaCalea } from "@/lib/fisiere";
import { supabase } from "@/lib/supabase/server";

const NEGASIT = new Response("Fișierul nu există.", { status: 404 });

/**
 * Descărcarea unui fișier de la „Materiale”: materialul se citește cu sesiunea omului (RLS),
 * apoi omul e trimis la un link semnat, bun 60 de secunde.
 */
export async function GET(_cerere: Request, { params }: { params: Promise<{ id: string }> }) {
  await eu();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NEGASIT.clone();
  const db = await supabase();
  const { data: m } = await db.from("materiale").select("cale").eq("id", id).maybeSingle();
  const cale = m?.cale ? desfaCalea(m.cale) : null;
  if (!m?.cale || !cale) return NEGASIT.clone();
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(m.cale, 60, { download: cale.nume });
  if (error || !data) return NEGASIT.clone();
  return Response.redirect(data.signedUrl, 307);
}
