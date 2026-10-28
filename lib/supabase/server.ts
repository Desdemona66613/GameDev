import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { type Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Next 16: `cookies()` is async — always `await createClient()`.
 * Create a fresh client per request; never cache it in a module variable.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — cookie writes are not allowed
            // there. Safe to ignore when session refresh happens in proxy.ts.
          }
        },
      },
    },
  );
}
