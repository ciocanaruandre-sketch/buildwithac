import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";

/** Cont oprit sau fără profil: îl deconectăm și îi spunem de ce. */
export async function GET(cerere: NextRequest) {
  const db = await supabase();
  await db.auth.signOut();
  const url = cerere.nextUrl.clone();
  url.pathname = "/intra";
  url.search = "?oprit=1";
  return NextResponse.redirect(url);
}
