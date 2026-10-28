# Database

The schema lives here, not in the Supabase dashboard. Dashboard edits are
untracked, unreviewable and unreproducible.

## Workflow

```bash
npx supabase migration new <name>   # creates supabase/migrations/<ts>_<name>.sql
# write the SQL by hand, then:
npx supabase db push                # apply to the linked project
npm run db:types                    # regenerate lib/database.types.ts
```

## Rules for every table

1. `alter table <t> enable row level security;` in the same migration that
   creates it. A table without RLS is readable by anyone holding the anon key,
   which is public.
2. Write the SELECT policy before enabling realtime on the table. The policy is
   what decides which rows land in a given user's websocket.
3. Separate policies per operation (select / insert / update / delete). One
   catch-all `for all` policy is how you accidentally grant writes.

## Testing policies

RLS bugs don't throw errors — they silently return rows to the wrong person.
`supabase/tests/rls.sql` asserts that an uninvolved user cannot read or write
other people's data. Run it after every migration that touches a policy:

```bash
psql "$DATABASE_URL" -f supabase/tests/rls.sql
```

Every check prints PASS or FAIL, and the whole thing runs in a transaction that
rolls back, so it's safe against a dev database. Any FAIL is a data leak.

Tests run as an unprivileged role on purpose. A table owner bypasses RLS
entirely, so testing as the owner would pass regardless of what the policies
say — which is the most common way people convince themselves their RLS works.

Without a Supabase stack, apply `tests/00-local-stub.sql` to bare Postgres
first; it creates `auth.users`, `auth.uid()` and the realtime publication.
