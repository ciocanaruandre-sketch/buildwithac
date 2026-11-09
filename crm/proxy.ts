import type { NextRequest } from "next/server";
import { actualizeazaSesiune } from "@/lib/supabase/proxy";

export async function proxy(cerere: NextRequest) {
  return actualizeazaSesiune(cerere);
}

export const config = {
  // fără fișierele statice și fonturi
  matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
