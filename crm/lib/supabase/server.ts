import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/baza.types";

/** Clientul cu sesiunea omului conectat: RLS se aplică. */
export async function supabase(): Promise<SupabaseClient<Database>> {
  const borcan = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => borcan.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) borcan.set(name, value, options);
        } catch {
          // apelat dintr-o pagină (nu dintr-o acțiune): proxy.ts reîmprospătează sesiunea
        }
      },
    },
  });
}
