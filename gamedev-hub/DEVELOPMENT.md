# GameDev Hub — Development Rules

Stack: Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript 5 (strict) · Tailwind 4 · Supabase · Zod

These rules are enforced by tooling wherever possible. `pnpm check` must pass before every commit; `pnpm build` must pass before every merge.

## 1. Type safety (non-negotiable)

- `tsconfig` runs with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `allowJs: false`. Do not weaken these.
- **No `any`.** No `as any`, no `@ts-ignore`. If suppression is truly unavoidable, use `@ts-expect-error` with a comment explaining why. Prefer `unknown` + narrowing.
- **Non-null assertions (`!`) are banned** (ESLint `no-non-null-assertion` via strict preset). Handle the `null`/`undefined` case or prove it away with a type guard.
- ESLint runs typescript-eslint `strict-type-checked` + `stylistic-type-checked`: floating promises, unsafe assignments, misused promises and unhandled errors are compile-time failures, not code-review notes.
- Exported functions declare explicit return types (`explicit-module-boundary-types`).
- Type-only imports use `import { type X }` (auto-fixable).

## 2. Data boundaries

- **Database types are generated, never hand-written.** Run `pnpm db:types` after every schema migration (`lib/database.types.ts` is currently a placeholder stub — regenerate before writing real queries). Both Supabase clients are `createClient<Database>()`, so column names and nullability are checked at compile time.
- **Validate at every trust boundary with Zod.** Anything crossing into the app — env vars, form input, Server Action payloads, route params, external API responses, webhook bodies — gets a Zod schema and `z.infer` for its type. TypeScript types describe data; Zod proves it.
- Env vars are read only through `lib/env.ts`. Never `process.env.X` elsewhere, never `!` on env values.
- The service-role key, if ever added, is server-only (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix) and never imported into anything reachable from a Client Component.
- Row Level Security stays enabled on every table. The anon key is public by design; RLS is the actual security boundary.

## 3. Auth & realtime

The app uses Supabase auth (user accounts) and Supabase realtime (live updates between users). That combination makes RLS load-bearing, not optional.

- **`proxy.ts` refreshes sessions only.** It never authorizes. It may run at the edge and must not be the sole barrier between a request and private data.
- **Authorization lives in the data layer** — `lib/auth.ts` (`requireUser()`) at the top of protected layouts, pages and Server Actions, plus RLS in the database. Two independent layers; neither is trusted alone.
- **Always `auth.getUser()`, never `auth.getSession()`.** `getUser()` revalidates the token with Supabase; `getSession()` trusts a cookie the client controls.
- **Every table has RLS enabled in the migration that creates it**, with separate policies per operation. No catch-all `for all` policies.
- **Realtime is gated by RLS.** A subscription's `filter` narrows the stream, it does not secure it. Before enabling realtime on a table, its SELECT policy gets written and reviewed deliberately — a wrong policy here leaks other users' rows silently, over a socket, with nothing in the logs.
- **Server-render the initial rows, subscribe for deltas.** Never let first paint wait on a websocket.
- **Every policy change is followed by `psql "$DATABASE_URL" -f supabase/tests/rls.sql`.** RLS bugs return wrong rows rather than raising errors, so nothing else catches them. The tests run as an unprivileged role — a table owner bypasses RLS, so owner-based testing passes no matter what the policies say.
- Schema changes go through `supabase/migrations/` (see `supabase/README.md`). Dashboard edits are untracked and don't exist as far as this repo is concerned.

## 4. Next.js 16 conventions

- This is Next 16 — read `node_modules/next/dist/docs/` when unsure (see AGENTS.md). Training-data-era patterns may be wrong.
- `params`, `searchParams`, `cookies()`, `headers()` are **async** — always `await`. Use the generated `PageProps`/`LayoutProps` helpers (`npx next typegen`).
- Server Components by default. Add `"use client"` only for state, effects, event handlers or browser APIs, and keep the boundary as close to the leaf as possible.
- Supabase access: `lib/supabase/server.ts` in Server Components/Actions/Route Handlers (await it), `lib/supabase/client.ts` in Client Components. Never mix them.
- Mutations go through Server Actions with Zod-validated payloads — no ad-hoc fetch to hand-rolled API routes.
- Caching is explicit and opt-in (`"use cache"`, `revalidateTag`/`updateTag`). Never rely on implicit caching behavior.
- `middleware.ts` is deprecated in favor of `proxy.ts` — use `proxy.ts` for session refresh when auth lands.

## 5. Design system

- Tokens live in `app/globals.css` under Tailwind 4's `@theme`. Components use token classes (`text-missing`, `bg-have-soft`, `border-line`), never raw hex.
- **Solid swatch = a skill someone has. Checkered swatch = a skill they're missing.** That distinction carries the whole interface; don't add a third state without a reason.
- Type: Bricolage Grotesque for display (`font-display`), Inter for body. Two families, no more.
- UI copy is Czech, sentence case, second person singular. No all-caps labels, no arrows glued to link text.
- Empty states say what to do next, not that something is empty.
- `lib/mock-data.ts` is scaffolding for design validation. Its shapes mirror the planned tables so the swap to `lib/data/` is mechanical. Delete it once real queries exist.

## 6. Security & quality bar

- **Warnings are errors.** `eslint . --max-warnings=0`. Never silence a rule to make CI pass; fix the code, or argue the rule out in review.
- `pnpm check` = typecheck + zero-warning lint + format + `pnpm audit --audit-level=high`. All four gate every commit.
- CI additionally runs CodeQL (`security-extended`), a production build, and archives a CycloneDX SBOM.
- Security headers live in `next.config.ts`; the nonce-based CSP is built per request in `proxy.ts`.
- **A page that needs the CSP nonce must render dynamically.** A prerendered page has no per-request nonce, and `strict-dynamic` then blocks every script. The page still renders from SSR, so this fails silently and looks fine while being completely dead. If you add a static route, open it in a browser with the CSP on and check the console.
- Disclosure policy in `SECURITY.md` and `public/.well-known/security.txt` (RFC 9116). Keep the `Expires` field current.
- `CRA-ANNEX-I.md` records how we meet the CRA Annex I requirements as a quality bar. Update it when the security posture changes.

## 7. Testing

- **Playwright runs against a production build**, never `next dev`. The CSP nonce, static-vs-dynamic rendering and minified React all behave differently in dev, and this project has already shipped a bug that only appears in a production build.
- `pnpm test:e2e` for the suite, `pnpm test:e2e:ui` to step through it interactively.
- Suites: `smoke` (routes render, zero console errors), `navigation` (clicks and dead-link crawl), `security` (headers, CSP shape, nonce rotation), `a11y` (axe, WCAG 2.1 AA), `auth` (validation, no account enumeration, no open redirect).
- **The dev base URL must be `localhost`, not `127.0.0.1`.** Our CSP sets `upgrade-insecure-requests`; Chrome exempts `localhost` but not `127.0.0.1`, so over http a form POST is rewritten to https, hits nothing, and fails silently with no error in the console or server log.
- `reuseExistingServer` is on locally. It's convenient but will happily test a stale server started before you added a route — kill stray `next start` processes when a result looks impossible.
- Database policies are tested separately, in SQL: `supabase/tests/rls.sql`.

## 8. Deployment (Cloudflare Workers)

- `@opennextjs/cloudflare` runs real Next.js on Workers. Cloudflare also promotes `vinext`, which reimplements the Next.js API surface; we chose the adapter that runs the actual framework.
- `pnpm cf:preview` for the local Workers runtime, `pnpm cf:deploy` to ship.
- `compatibility_date` is pinned in `wrangler.jsonc`. Bumping it is a reviewed change, not a drive-by.
- Secrets go in via `wrangler secret put`, never into `wrangler.jsonc` or the repo.
- Enable at the Cloudflare edge: WAF managed rules, rate limiting on `/sign-in` and the auth callbacks, Bot Fight Mode, and Turnstile on signup. Those are the free-tier controls that matter most here.

## 9. Code style & hygiene

- Prettier is the single formatter (`pnpm format`); Tailwind classes are auto-sorted. No formatting debates.
- `eqeqeq` always; `console.log` is banned in committed code (`warn`/`error` allowed).
- Errors from Supabase calls are handled explicitly — check `error !== null` before using `data`; never swallow errors silently.
- No dead code, no commented-out blocks, no `Nová složka`-style scratch folders in the repo.
- English identifiers and comments in code; UI copy may be Czech.

## 10. Editor & environment

- `pnpm setup` is the only onboarding step. If it stops working, fix the script rather than writing new instructions in a wiki.
- `.gitattributes` forces LF everywhere. On Windows, Git's default `core.autocrlf=true` would otherwise check files out as CRLF and make `format:check` fail locally while passing in CI. Don't remove it.
- `.vscode/settings.json` pins TypeScript to `node_modules/typescript`, so the editor's errors match `pnpm typecheck` exactly.
- ESLint's flat config does **not** read `.gitignore`. Any new generated directory must be added to `globalIgnores` in `eslint.config.mjs` or it gets linted.

## 11. Package management

- **pnpm is the package manager.** `packageManager` is pinned in `package.json`; `pnpm-lock.yaml` is committed and is the source of truth. Don't run npm or yarn against this repo.
- CI uses `pnpm install --frozen-lockfile`, so a lockfile that drifted from `package.json` fails the build instead of silently re-resolving.
- Add deps with `pnpm add <pkg>` / `pnpm add -D <pkg>`; one-off tools via `pnpm dlx <tool>`.
- **Declare what you import.** pnpm's store is strict: a package you `import` must be a direct dependency, not something reachable by accident through a transitive. npm's flat hoisting hides this class of bug; pnpm surfaces it. If a build fails on a missing module, the fix is almost always `pnpm add -D <the thing>`, not a hoist workaround.
- **Install scripts are blocked by default.** The allowlist lives in `pnpm-workspace.yaml` under `allowBuilds` and is currently three packages that fetch native binaries. Keep it as short as possible, and justify every addition in the PR — this is a real supply-chain control, not a formality.
- **Overrides live in `pnpm-workspace.yaml`.** Each needs a comment saying why and gets removed once upstream ships the fix. Currently one: `undici` forced to >=7.29.0 because cdxgen pins a version affected by GHSA-4cwx-7wf7-3272.
- **`minimumReleaseAge` is on.** pnpm refuses dependency versions published inside a recent window, which blunts the "malicious version published an hour ago" attack. If a legitimate fresh release is blocked, add a scoped exclusion rather than turning the policy off.

> **snpm was evaluated and does not work.** Install and lint were fine and it was fast, but `next build` fails under its symlinked store: Turbopack cannot resolve `@supabase/ssr`, `@swc/helpers/*` or `@vercel/turbopack/postcss` (101 errors). `node-linker=hoisted` in `.npmrc` was silently ignored by snpm 2026.7.29. pnpm's symlinked store handles the same build without issue, so this is an snpm bug rather than a symlink-layout problem.

## 12. Secrets

- `.env.local` is gitignored (`.env*`) and stays that way. Only `.env.example` (with placeholder values) is committed.
- The anon key leaked in the shared zip should be rotated if this repo was ever public.

## Commands

`pnpm` lets you drop `run` for any script that isn't a pnpm builtin, so `pnpm build`, `pnpm dev` and `pnpm check` all work. The exception is **`audit`**: `pnpm audit` invokes pnpm's own builtin (which also fails on moderate advisories) instead of our script. Use `pnpm run audit` for the gate version. `pnpm run <script>` is always unambiguous.

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `pnpm run setup`       | One-command environment setup (safe to re-run) |
| `pnpm install`         | Install dependencies (from `pnpm-lock.yaml`)   |
| `pnpm dev`             | Dev server (Turbopack)                         |
| `pnpm check`           | typecheck + lint + format + audit (pre-commit) |
| `pnpm typecheck`       | `tsc --noEmit`                                 |
| `pnpm lint`            | ESLint, zero warnings tolerated                |
| `pnpm lint:fix`        | ESLint with autofix                            |
| `pnpm format`          | Prettier write                                 |
| `pnpm run audit`       | Dependency audit, fails at high severity       |
| `pnpm sbom`            | Generate CycloneDX SBOM (cdxgen)               |
| `pnpm db:types`        | Regenerate `lib/database.types.ts` from schema |
| `pnpm build`           | Production build (must pass before merge)      |
| `pnpm cf:preview`      | Run on the local Cloudflare Workers runtime    |
| `pnpm cf:deploy`       | Deploy to Cloudflare Workers                   |
| `pnpm start`           | Serve the production build locally             |
| `pnpm format:check`    | Prettier check only (used by CI)               |
| `pnpm typecheck:watch` | `tsc` in watch mode (VS Code background task)  |
| `pnpm cf:build`        | Build the Cloudflare Worker bundle             |
