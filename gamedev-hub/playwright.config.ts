import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
// MUST be `localhost`, not `127.0.0.1`. Our CSP sets `upgrade-insecure-requests`,
// and Chrome exempts `localhost` from that upgrade but not `127.0.0.1` — over
// plain http the form POST gets rewritten to https, finds no listener, and dies
// silently with no error anywhere. Cost an hour to find once already.
const baseURL = `http://localhost:${String(PORT)}`;

/**
 * Tests run against a PRODUCTION build, not `next dev`.
 *
 * That matters here: the CSP nonce, static-vs-dynamic rendering, and minified
 * React behave differently in dev. A suite that passes against `next dev` can
 * miss the exact class of bug this project has already hit once.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Serial in CI for stable timing; parallel locally.
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: "pnpm run build && pnpm start --port " + String(PORT),
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Placeholders: these tests never reach a real database. Anything that
      // needs live Supabase belongs in a separate, credentialed suite.
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-placeholder-key",
    },
  },
});
