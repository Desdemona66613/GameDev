-- RLS policy tests.
--
-- These assert that an uninvolved user cannot read or write other people's
-- data. Run them after every migration that touches a policy.
--
--   Against a local Supabase stack:
--     psql "$DATABASE_URL" -f supabase/tests/rls.sql
--
--   Against bare Postgres (no Supabase), apply 00-local-stub.sql first to
--   create auth.users, auth.uid() and the realtime publication.
--
-- Every check prints PASS or FAIL. Any FAIL is a data leak.

begin;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test'),
  ('33333333-3333-3333-3333-333333333333', 'mallory@test');

insert into requests (id, author_id, title, needs, estimate_hours, credits)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'Smycka do menu, 30 sekund', 'hudba', 3, 6);

insert into offers (id, request_id, helper_id, message)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222', 'Muzu to vzit');

insert into messages (offer_id, sender_id, body)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222', 'Tajna zprava');

-- Act as an unprivileged role, the way PostgREST does. A table owner bypasses
-- RLS, so testing as the owner would pass no matter what the policies say.
create role rls_test_user nologin;
grant usage on schema public to rls_test_user;
grant select, insert, update, delete on all tables in schema public to rls_test_user;
set local role rls_test_user;

-- --- Reads ------------------------------------------------------------------

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || ' — request author sees the conversation' from messages;

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select case when count(*) = 1 then 'PASS' else 'FAIL' end
       || ' — helper sees the conversation' from messages;

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || ' — outsider cannot read the conversation' from messages;

select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || ' — outsider cannot read private offers' from offers;

select case when count(*) = 0 then 'PASS' else 'FAIL' end
       || ' — outsider cannot read another user''s credit ledger'
from credit_entries
where profile_id <> '33333333-3333-3333-3333-333333333333';

-- --- Writes -----------------------------------------------------------------
-- Each must raise; the exception handler turns that into a PASS.

do $$
begin
  begin
    perform set_config('request.jwt.claim.sub',
                       '33333333-3333-3333-3333-333333333333', true);
    insert into messages (offer_id, sender_id, body)
    values ('bbbbbbbb-0000-0000-0000-000000000001',
            '33333333-3333-3333-3333-333333333333', 'inject');
    raise warning 'FAIL — outsider injected a message';
  exception when insufficient_privilege then
    raise notice 'PASS — outsider cannot post into a conversation';
  end;

  begin
    perform set_config('request.jwt.claim.sub',
                       '22222222-2222-2222-2222-222222222222', true);
    insert into messages (offer_id, sender_id, body)
    values ('bbbbbbbb-0000-0000-0000-000000000001',
            '11111111-1111-1111-1111-111111111111', 'faked');
    raise warning 'FAIL — sender_id can be spoofed';
  exception when insufficient_privilege then
    raise notice 'PASS — sender_id cannot be spoofed';
  end;

  begin
    perform set_config('request.jwt.claim.sub',
                       '11111111-1111-1111-1111-111111111111', true);
    insert into offers (request_id, helper_id)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
            '11111111-1111-1111-1111-111111111111');
    raise warning 'FAIL — author offered on their own request';
  exception when insufficient_privilege then
    raise notice 'PASS — cannot offer on your own request';
  end;

  begin
    perform set_config('request.jwt.claim.sub',
                       '33333333-3333-3333-3333-333333333333', true);
    insert into credit_entries (profile_id, amount, reason)
    values ('33333333-3333-3333-3333-333333333333', 9999, 'adjustment');
    raise warning 'FAIL — credits can be forged from the client';
  exception when insufficient_privilege then
    raise notice 'PASS — credits cannot be forged from the client';
  end;
end $$;

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
update profiles set display_name = 'pwned'
where id = '11111111-1111-1111-1111-111111111111';
-- Reports UPDATE 0 when the policy holds.

rollback;
