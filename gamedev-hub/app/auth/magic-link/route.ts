import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  email: z.email().max(254),
});

/**
 * Sends a magic-link sign-in email.
 *
 * Deliberately always redirects to the same "check your inbox" state, whether
 * or not the address exists. Distinguishing the two would turn this into an
 * account-enumeration oracle.
 *
 * Rate limiting is enforced at the Cloudflare edge on this path — see
 * DEVELOPMENT.md §7. There is none locally.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const parsed = payloadSchema.safeParse({ email: form.get("email") });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/sign-in?error=email", request.url), {
      status: 303,
    });
  }

  const supabase = await createClient();
  const origin = new URL(request.url).origin;

  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  // Same response either way. Never leak whether the account exists.
  return NextResponse.redirect(new URL("/sign-in?sent=1", request.url), {
    status: 303,
  });
}
