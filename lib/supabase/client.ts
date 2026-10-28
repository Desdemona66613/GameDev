import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/** Supabase client for Client Components ("use client"). One instance per call site is fine — it's cookie-backed and cheap. */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
