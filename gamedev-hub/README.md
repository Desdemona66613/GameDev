# GameDev Hub

Next.js 16 (App Router) · React 19.2 · TypeScript 5 (strict) · Tailwind 4 · Supabase · Zod

## Getting started

Requires Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
pnpm dev
```

Open http://localhost:3000.

## Database types

`lib/database.types.ts` is **generated**, never hand-edited. After linking your Supabase project:

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm db:types
```

Regenerate after every migration.

## Tests

```bash
pnpm test:e2e        # full suite against a production build
pnpm test:e2e:ui     # step through it interactively
```

Database policies are tested separately, in SQL:

```bash
psql "$DATABASE_URL" -f supabase/tests/rls.sql
```

## Before you commit

```bash
pnpm check   # typecheck + lint + format check
```

CI runs the same checks plus a production build.

## Project layout

```
app/                    App Router routes (Server Components by default)
lib/env.ts              Zod-validated environment variables
lib/database.types.ts   Generated Supabase schema types
lib/supabase/server.ts  Supabase client for Server Components / Actions
lib/supabase/client.ts  Supabase client for Client Components
lib/auth.ts             getUser() / requireUser()
lib/realtime.ts         Typed realtime subscription hook
proxy.ts                Session refresh (runs before every render)
supabase/migrations/    Schema, as version-controlled SQL
supabase/tests/rls.sql  RLS policy tests (run after every policy change)
e2e/                    Playwright suites: smoke, navigation, security, a11y, auth
scripts/setup.mjs       One-command environment setup
.vscode/                Editor config, debugger, tasks
```

## Development rules

See [DEVELOPMENT.md](./DEVELOPMENT.md). They are binding — the tooling enforces most of them.
