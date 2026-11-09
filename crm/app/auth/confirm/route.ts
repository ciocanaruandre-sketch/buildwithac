import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";

/** Linkul din e-mailul de invitație sau de parolă nouă: verifică tokenul, apoi omul își alege parola. */
export async function GET(cerere: NextRequest) {
  const p = cerere.nextUrl.searchParams;
  const token_hash = p.get("token_hash");
  const type = p.get("type") as EmailOtpType | null;
  const url = cerere.nextUrl.clone();
  url.search = "";
  if (token_hash && (type === "invite" || type === "recovery")) {
    const db = await supabase();
    const { error } = await db.auth.verifyOtp({ type, token_hash });
    if (!error) {
      url.pathname = "/parola";
      return NextResponse.redirect(url);
    }
  }
  url.pathname = "/intra";
  url.searchParams.set("uitat", "1");
  return NextResponse.redirect(url);
}
