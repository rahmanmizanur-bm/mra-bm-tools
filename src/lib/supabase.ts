// Single Supabase client shared across islands.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const ALLOWED_DOMAIN = "webalive.com.au";
export const isConfigured = Boolean(URL && ANON);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    if (!isConfigured) throw new Error("Supabase is not configured (missing PUBLIC_SUPABASE_* env)");
    client = createClient(URL!, ANON!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
