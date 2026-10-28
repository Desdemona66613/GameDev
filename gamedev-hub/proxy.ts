import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every request.
 *
 * Server Components cannot write cookies, so the refreshed session token has to
 * be set here, before rendering. Without this, sessions silently expire and
 * users get logged out mid-visit.
 *
 * Deliberately does NOT do authorization. Route protection belongs in the
 * layouts and Server Actions that own the data, where it can be tested. The
 * proxy may run at the edge and must not be the only thing standing between a
 * request and private data.
 */
/**
 * Builds a strict Content-Security-Policy bound to a per-request nonce.
 *
 * `strict-dynamic` lets Next's nonced bootstrap script load its own chunks
 * without us enumerating them, while still rejecting anything an injection
 * would add. No `unsafe-inline` in script-src.
 *
 * `style-src` still needs `unsafe-inline`: Next injects inline style attributes
 * for font loading that cannot currently carry a nonce. Documented rather than
 * hidden.
 */
function contentSecurityPolicy(nonce: string, supabaseOrigin: string): string {
  const dev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // 16 bytes of CSPRNG entropy, base64-encoded. Regenerated every request.
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    contentSecurityPolicy(nonce, env.NEXT_PUBLIC_SUPABASE_URL),
  );

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Touching getUser() is what triggers the refresh. Do not remove.
  await supabase.auth.getUser();

  response.headers.set(
    "Content-Security-Policy",
    contentSecurityPolicy(nonce, env.NEXT_PUBLIC_SUPABASE_URL),
  );

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
