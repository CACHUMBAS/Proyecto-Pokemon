-- Run AFTER the migration, in a development Supabase project's SQL Editor.
-- Fixtures are rolled back. If a statement fails, run ROLLBACK before retrying.
begin;
insert into auth.users (id) values
  ('aab00000-0000-4000-8000-000000000001'),
  ('aab00000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aab00000-0000-4000-8000-000000000001', true);
select * from public.ensure_player_profile();
select * from public.ensure_player_profile();
do $$ begin
  if (select count(*) from public.player_profiles) <> 1 then raise exception 'A must see exactly one profile'; end if;
end $$;
update public.player_profiles set display_name = 'Player A';
select set_config('request.jwt.claim.sub', 'aab00000-0000-4000-8000-000000000002', true);
select * from public.ensure_player_profile();
do $$ declare changed int; begin
  if (select count(*) from public.player_profiles) <> 1 then raise exception 'B must see only B'; end if;
  update public.player_profiles set display_name = 'Intruder'
    where id = 'aab00000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'B updated A'; end if;
  begin
    update public.player_profiles set created_at = now();
    raise exception 'Server timestamp was writable';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.player_profiles;
    raise exception 'Profile deletion was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.player_profiles (id) values ('aab00000-0000-4000-8000-000000000001');
    raise exception 'Direct insertion was allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.player_profiles set display_name = 'ab';
    raise exception 'Invalid alias was accepted';
  exception when check_violation then null; end;
end $$;

set local role anon;
do $$ begin
  begin
    perform * from public.player_profiles;
    raise exception 'Anonymous read was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.ensure_player_profile();
    raise exception 'Anonymous initialization was allowed';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ begin
  if (select display_name from public.player_profiles where id = 'aab00000-0000-4000-8000-000000000001') <> 'Player A'
    then raise exception 'A profile changed unexpectedly'; end if;
end $$;
rollback;
select 'player_profiles: isolation and permissions passed' as result;
