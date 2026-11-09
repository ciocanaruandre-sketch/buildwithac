import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { primesteCerere } from "@/lib/intrare";
import { admin } from "@/lib/supabase/admin";
import { SERVICII } from "@/lib/tipuri";

const Corp = z.object({
  nume: z.string().trim().min(2).max(80),
  telefon: z.string().trim().min(7).max(30),
  serviciu: z.enum(SERVICII),
  descriere: z.string().max(1000).optional().default(""),
  utm: z.record(z.string(), z.string().max(200)).optional().catch({}),
});

function autorizat(cerere: Request): boolean {
  const secret = process.env.CRM_SECRET_INTRARE;
  const antet = cerere.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(antet);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Lead din formularul de pe buildwithac.ro. Site-ul trimite e-mailul lui, cu link la fișă: aici nu se mai notifică. */
export async function POST(cerere: Request) {
  if (!autorizat(cerere)) return Response.json({ eroare: "neautorizat" }, { status: 401 });
  const date = Corp.safeParse(await cerere.json().catch(() => null));
  if (!date.success) return Response.json({ eroare: "invalid" }, { status: 400 });
  const { nume, telefon, serviciu, descriere, utm } = date.data;
  try {
    const r = await primesteCerere(
      {
        nume,
        telefon,
        email: null,
        serviciu,
        sursa: "formular_site",
        raspunsuri: descriere ? [{ intrebare: "Descriere", raspuns: descriere }] : [],
        utm: utm ?? {},
        idExtern: null,
      },
      admin(),
    );
    return Response.json({ id: r.id });
  } catch (e) {
    console.error("intrare/site", e);
    return Response.json({ eroare: "indisponibil" }, { status: 500 });
  }
}
