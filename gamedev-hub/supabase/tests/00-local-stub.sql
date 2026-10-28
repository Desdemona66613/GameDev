-- Minimal stand-ins for what Supabase provides, so the migration can be
-- executed and checked outside a real Supabase project.
create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Supabase derives this from the request JWT. Here it reads a session setting
-- so tests can impersonate a user.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create publication supabase_realtime;
