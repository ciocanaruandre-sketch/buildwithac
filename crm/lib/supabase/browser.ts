import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Clientul din browser, fără sesiune: folosit DOAR ca să urce un fișier cu un link semnat
 * (uploadToSignedUrl). Dreptul de a urca îl verifică serverul, când face linkul.
 */
export function supabaseBrowser(): SupabaseClient {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
