import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { golesteCoada } from "@/lib/calendar/coada";
import { cripteaza } from "@/lib/calendar/criptare";
import { schimbaCod } from "@/lib/calendar/google";
import { cerRol } from "@/lib/eu";
import { admin } from "@/lib/supabase/admin";

export const maxDuration = 60;

function aceeasi(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Întoarcerea de la Google: cheia se păstrează criptată, iar discuțiile viitoare ale omului intră în calendar. */
export async function GET(cerere: Request) {
  const om = await cerRol("admin", "closer");
  const url = new URL(cerere.url);
  const inapoi = (google: "ok" | "anulat" | "eroare") => Response.redirect(`${url.origin}/program?google=${google}`, 303);

  const borcan = await cookies();
  const asteptata = borcan.get("google_stare")?.value;
  borcan.delete({ name: "google_stare", path: "/api/google" });
  const stare = url.searchParams.get("state");
  if (!asteptata || !stare || !aceeasi(stare, asteptata)) return inapoi("eroare");
  if (url.searchParams.get("error") === "access_denied") return inapoi("anulat");
  const cod = url.searchParams.get("code");
  if (!cod) return inapoi("eroare");

  const db = admin();
  try {
    const { refresh, email } = await schimbaCod(cod, `${url.origin}/api/google/intoarcere`);
    const { error } = await db
      .from("google_conexiuni")
      .upsert({ om_id: om.id, email, refresh_criptat: cripteaza(refresh), stare: "ok", conectat_la: new Date().toISOString() });
    if (error) throw error;
  } catch (e) {
    console.error("calendar: conectarea", e);
    return inapoi("eroare");
  }
  // discuțiile viitoare care nu sunt încă în Google (programate înainte sau cât legătura era căzută)
  await db.rpc("calendar_pune_viitoare", { p_om: om.id });
  await golesteCoada(db, fetch, { om: om.id, limita: 100 }).catch((e) => console.error("calendar: după conectare", e));
  return inapoi("ok");
}
