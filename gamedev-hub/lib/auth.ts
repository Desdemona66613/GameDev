import { type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * The current user, or null. Use in Server Components that render differently
 * for signed-in users but don't require one.
 *
 * Always `getUser()`, never `getSession()`: getUser() revalidates the token
 * against Supabase, while getSession() trusts a cookie the client could forge.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * The current user, or a redirect to sign-in. Use at the top of any protected
 * layout, page or Server Action.
 *
 * Authorization lives here and in the data layer, not in proxy.ts. The proxy
 * only refreshes sessions.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();

  if (user === null) {
    redirect("/sign-in");
  }

  return user;
}
