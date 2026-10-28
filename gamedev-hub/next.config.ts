import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * CSP note: Next injects inline bootstrap scripts, so `'unsafe-inline'` in
 * script-src would normally be required. We use a nonce via proxy.ts instead —
 * see `proxy.ts`. `frame-ancestors 'none'` is the modern replacement for
 * X-Frame-Options, which is kept for older agents.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Never ship a build that only "works" because checks were skipped.
  // (Next 16 removed the `eslint` config key along with `next lint`; linting is
  // enforced by `npm run check` and CI instead.)
  typescript: { ignoreBuildErrors: false },

  // Link hrefs are checked against real routes at compile time.
  typedRoutes: true,

  // Don't advertise the framework version to scanners.
  poweredByHeader: false,

  // Trailing-slash ambiguity is a cache-poisoning foothold; pick one.
  trailingSlash: false,

  // Dočasně vypnuto kvůli blokování skriptů na Vercelu
  // headers() {
  //   return Promise.resolve([{ source: "/:path*", headers: securityHeaders }]);
  // },
};

export default nextConfig;