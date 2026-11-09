import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/baza.types";

/** Clientul cu cheia de serviciu: trece peste RLS. Doar pentru intrarea lead-urilor, jobul zilnic și conturi (Admin). */
export function admin(): SupabaseClient<Database> {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
