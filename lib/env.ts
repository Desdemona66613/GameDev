import { z } from "zod";

/**
 * Validated environment variables. Import `env` from here — never read
 * `process.env` directly elsewhere. The app fails fast at startup/build
 * with a readable error instead of crashing later with `undefined`.
 *
 * Note: NEXT_PUBLIC_* values are inlined at build time, so they must be
 * referenced literally (`process.env.NEXT_PUBLIC_X`), not dynamically.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
