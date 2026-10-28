# Annex I mapping

GameDev Hub is a hosted web service, so it is very likely **outside the scope of
the Cyber Resilience Act** (Regulation (EU) 2024/2847), which governs products
with digital elements placed on the EU market rather than SaaS. It is also not
an Annex III Class I product: that class covers identity management systems,
browsers, password managers, VPNs and similar, and classification turns on a
product's _core functionality_. Ours is matching people for skill exchange;
authentication is a supporting feature, not the product.

Annex I is nevertheless a coherent engineering bar, so we hold ourselves to it.
This is an internal quality record, **not** a claim of conformity. No CE marking
or Declaration of Conformity is implied.

## Part I — essential requirements

| Requirement                             | How it's met                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| (1) Secure by design, no known vulns    | `pnpm audit --audit-level=high` gates CI; CodeQL `security-extended` on every PR                                          |
| (2) Secure by default configuration     | RLS enabled on every table at creation; deny-by-default policies; no permissive catch-all grants                          |
| (3) Protection from unauthorised access | Supabase Auth with server-side token revalidation (`getUser()`, never `getSession()`); RLS as a second, independent layer |
| (4) Confidentiality                     | TLS 1.3 in transit; encryption at rest by the database provider; no secrets in the repo                                   |
| (5) Integrity                           | Constrained columns and enums; append-only credit ledger; `security definer` functions pinned with `set search_path = ''` |
| (6) Data minimisation                   | Profiles hold handle, name, optional location and bio. No phone, address, or payment data                                 |
| (7) Availability / DoS resilience       | Cloudflare WAF and rate limiting in front of the Worker; DB indexes on the hot query paths                                |
| (8) Minimise attack surface             | No client write path to the credit ledger; `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`               |
| (9) Exploit mitigation                  | Nonce-based CSP with `strict-dynamic`, no `unsafe-inline` in `script-src`; HSTS preload; `nosniff`                        |
| (10) Security-relevant logging          | Cloudflare Workers observability enabled; Supabase auth audit log                                                         |
| (11) Secure updates                     | Deploys are immutable Worker versions with instant rollback                                                               |

## Part II — vulnerability handling

| Requirement               | How it's met                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| (1) Identify and document | CycloneDX 1.6 SBOM via `pnpm sbom` (cdxgen), archived per CI run |
| (2) Address without delay | Response timelines in `SECURITY.md`; audit gate blocks merges    |
| (3) Regular testing       | Typecheck, zero-warning lint, CodeQL and build on every PR       |
| (4) Disclose fixed vulns  | Release notes on the repo                                        |
| (5) Disclosure policy     | `SECURITY.md` plus RFC 9116 `public/.well-known/security.txt`    |
| (6) Contact address       | Same                                                             |
| (7) Secure distribution   | Deploys delivered over TLS by Cloudflare                         |
| (8) Prompt, free patches  | Rolling deploys; nothing for users to install                    |

## Known gaps

- `style-src` still needs `'unsafe-inline'`. Next injects inline style
  attributes for font loading that cannot carry a nonce today.
- No formal threat model document yet. Worth writing before public launch.
- Rate limiting is configured at Cloudflare, not in the app, so local
  development has none.
- No automated test suite yet. Vitest and Playwright are the intended additions,
  and RLS policies in particular need tests with two real accounts.
