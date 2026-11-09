import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/baza.types";

/** Căile care merg fără conectare. */
const PUBLICE = [/^\/intra/, /^\/parola/, /^\/auth\//, /^\/api\/intrare\//, /^\/api\/cron\//];

/** Reîmprospătează sesiunea Supabase și trimite la /intra pe cine nu e conectat. */
export async function actualizeazaSesiune(cerere: NextRequest) {
  let raspuns = NextResponse.next({ request: cerere });
  const db = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cerere.cookies.getAll(),
      setAll: (lista, antete) => {
        for (const { name, value } of lista) cerere.cookies.set(name, value);
        raspuns = NextResponse.next({ request: cerere });
        for (const { name, value, options } of lista) raspuns.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(antete ?? {})) raspuns.headers.set(k, v);
      },
    },
  });

  const { data } = await db.auth.getClaims();
  const cale = cerere.nextUrl.pathname;
  if (!data?.claims && !PUBLICE.some((r) => r.test(cale))) {
    const url = cerere.nextUrl.clone();
    url.pathname = "/intra";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return raspuns;
}
