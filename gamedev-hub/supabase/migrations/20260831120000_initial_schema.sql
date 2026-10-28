-- GameDev Hub — initial schema.
--
-- Every table enables RLS in the same statement block that creates it, with
-- separate policies per operation. Realtime is enabled only on tables whose
-- SELECT policy has been deliberately reviewed, because that policy is what
-- decides which rows reach a given user's websocket.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Disciplines
-- ---------------------------------------------------------------------------

create type discipline as enum (
  'programovani',
  'hudba',
  'zvuk',
  'grafika2d',
  'grafika3d',
  'leveldesign',
  'scenar',
  'marketing'
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  handle        text not null unique
                check (handle ~ '^[a-z0-9_-]{3,32}$'),
  display_name  text not null check (char_length(display_name) between 1 and 64),
  location      text check (char_length(location) <= 64),
  bio           text check (char_length(bio) <= 600),
  created_at    timestamptz not null default now()
);

alter table profiles enable row level security;

-- Profiles are public: the whole point is being discoverable.
create policy profiles_select_all on profiles
  for select using (true);

create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No delete policy: account deletion cascades from auth.users.

-- ---------------------------------------------------------------------------
-- Skills offered and needed
-- ---------------------------------------------------------------------------

create table profile_skills (
  profile_id  uuid not null references profiles (id) on delete cascade,
  discipline  discipline not null,
  -- 'offers' = can do this for others. 'needs' = wants this from others.
  kind        text not null check (kind in ('offers', 'needs')),
  primary key (profile_id, discipline, kind)
);

alter table profile_skills enable row level security;

create policy profile_skills_select_all on profile_skills
  for select using (true);

create policy profile_skills_insert_own on profile_skills
  for insert with check (auth.uid() = profile_id);

create policy profile_skills_delete_own on profile_skills
  for delete using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------

create table requests (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references profiles (id) on delete cascade,
  title           text not null check (char_length(title) between 8 and 120),
  body            text check (char_length(body) <= 4000),
  needs           discipline not null,
  estimate_hours  int not null check (estimate_hours between 1 and 200),
  credits         int not null check (credits between 1 and 400),
  status          text not null default 'open'
                  check (status in ('open', 'matched', 'done', 'cancelled')),
  created_at      timestamptz not null default now()
);

create index requests_open_idx on requests (created_at desc) where status = 'open';
create index requests_needs_idx on requests (needs) where status = 'open';

alter table requests enable row level security;

create policy requests_select_all on requests
  for select using (true);

create policy requests_insert_own on requests
  for insert with check (auth.uid() = author_id);

create policy requests_update_own on requests
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- What the author can give back, denormalised for the feed.
create table request_gives (
  request_id  uuid not null references requests (id) on delete cascade,
  discipline  discipline not null,
  primary key (request_id, discipline)
);

alter table request_gives enable row level security;

create policy request_gives_select_all on request_gives
  for select using (true);

create policy request_gives_write_own on request_gives
  for all using (
    exists (
      select 1 from requests r
      where r.id = request_id and r.author_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from requests r
      where r.id = request_id and r.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Offers
-- ---------------------------------------------------------------------------

create table offers (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references requests (id) on delete cascade,
  helper_id    uuid not null references profiles (id) on delete cascade,
  message      text check (char_length(message) <= 2000),
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at   timestamptz not null default now(),
  unique (request_id, helper_id)
);

alter table offers enable row level security;

-- Offers are private between the helper and the request author. Anyone else
-- sees only the count, via a view, not the rows.
create policy offers_select_involved on offers
  for select using (
    auth.uid() = helper_id
    or exists (
      select 1 from requests r
      where r.id = request_id and r.author_id = auth.uid()
    )
  );

create policy offers_insert_own on offers
  for insert with check (
    auth.uid() = helper_id
    -- Can't offer on your own request.
    and not exists (
      select 1 from requests r
      where r.id = request_id and r.author_id = auth.uid()
    )
  );

create policy offers_update_involved on offers
  for update using (
    auth.uid() = helper_id
    or exists (
      select 1 from requests r
      where r.id = request_id and r.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Messages (realtime)
-- ---------------------------------------------------------------------------

create table messages (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references offers (id) on delete cascade,
  sender_id   uuid not null references profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index messages_offer_idx on messages (offer_id, created_at);

alter table messages enable row level security;

-- REVIEWED FOR REALTIME. This policy is the websocket filter. A message is
-- visible only to the two people in the conversation it belongs to.
create policy messages_select_participants on messages
  for select using (
    exists (
      select 1
      from offers o
      join requests r on r.id = o.request_id
      where o.id = offer_id
        and (auth.uid() = o.helper_id or auth.uid() = r.author_id)
    )
  );

create policy messages_insert_participants on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from offers o
      join requests r on r.id = o.request_id
      where o.id = offer_id
        and (auth.uid() = o.helper_id or auth.uid() = r.author_id)
    )
  );

alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------------------
-- Credit ledger
-- ---------------------------------------------------------------------------
--
-- Append-only. A balance is always the sum of a profile's entries, never a
-- mutable column, so it can't silently drift and is auditable after the fact.

create table credit_entries (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles (id) on delete cascade,
  amount       int not null check (amount <> 0),
  reason       text not null
               check (reason in ('signup_grant', 'trade_earned', 'trade_spent', 'adjustment')),
  offer_id     uuid references offers (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index credit_entries_profile_idx on credit_entries (profile_id, created_at);

alter table credit_entries enable row level security;

-- Read your own ledger. Nobody writes to it from the client: entries are
-- created by security-definer functions when a trade completes.
create policy credit_entries_select_own on credit_entries
  for select using (auth.uid() = profile_id);

create or replace function credit_balance(p_profile_id uuid)
returns int
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::int
  from public.credit_entries
  where profile_id = p_profile_id;
$$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references offers (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete cascade,
  subject_id  uuid not null references profiles (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text check (char_length(body) <= 1000),
  created_at  timestamptz not null default now(),
  unique (offer_id, author_id),
  check (author_id <> subject_id)
);

alter table reviews enable row level security;

create policy reviews_select_all on reviews
  for select using (true);

create policy reviews_insert_participant on reviews
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1
      from offers o
      join requests r on r.id = o.request_id
      where o.id = offer_id
        and o.status = 'accepted'
        and (auth.uid() = o.helper_id or auth.uid() = r.author_id)
    )
  );

-- ---------------------------------------------------------------------------
-- New user bootstrap
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Nový uživatel')
  );

  -- Starting credits, so a new account can buy help before earning any.
  insert into public.credit_entries (profile_id, amount, reason)
  values (new.id, 5, 'signup_grant');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
