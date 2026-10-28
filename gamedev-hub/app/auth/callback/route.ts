import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the magic-link code for a session cookie.
 *
 * `next` is validated as a relative path before use: accepting it unchecked
 * would be an open redirect, which is how phishing links get laundered through
 * a trusted domain.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("next") ?? "/";

  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  if (code === null) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    return NextResponse.redirect(`${origin}/sign-in?error=invalid_code`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
