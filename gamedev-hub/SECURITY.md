# Security Policy

## Reporting a vulnerability

Report suspected vulnerabilities to **security@gamedev-hub.cz** (replace with a
real address before launch). Include the affected URL or component, steps to
reproduce, and any proof-of-concept.

- We acknowledge within **72 hours**.
- We aim to ship a fix or mitigation for a confirmed high-severity issue within
  **14 days**, and to keep you updated until it's closed.
- Please don't disclose publicly until a fix is out, or 90 days have passed.
- Testing against your own account is fine. Don't access other people's data,
  degrade the service, or run automated scanners against production.

We follow the coordinated disclosure model of ISO/IEC 29147 and ISO/IEC 30111.

## Supported versions

Only the currently deployed version is supported. There are no long-lived
release branches.

## What we run

- Transport: TLS 1.3 terminated at Cloudflare, HSTS with preload.
- Authentication: Supabase Auth, tokens revalidated server-side on every
  request. Sessions never trusted from a cookie alone.
- Authorization: two independent layers — application checks in Server Actions
  and the data layer, plus Postgres row-level security.
- Content Security Policy: nonce-based, `strict-dynamic`, no `unsafe-inline` in
  `script-src`.
- Dependencies: `npm audit` gates CI at high severity; a CycloneDX SBOM is
  generated per release.
