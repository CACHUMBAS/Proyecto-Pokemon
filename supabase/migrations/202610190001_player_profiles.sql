-- Lumemon: private player identity. No balances or inventory writable by the browser.
begin;

create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Trainer',
  created_at timestamptz not null default now(),
  constraint player_display_name_valid check (
    char_length(display_name) between 3 and 24
    and display_name = btrim(display_name)
    and display_name !~ '[[:cntrl:]]'
  )
);

alter table public.player_profiles enable row level security;
revoke all on table public.player_profiles from public, anon, authenticated;
grant select on table public.player_profiles to authenticated;
grant update (display_name) on table public.player_profiles to authenticated;

create policy player_profile_select_own on public.player_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy player_profile_update_own on public.player_profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.ensure_player_profile()
returns setof public.player_profiles
language plpgsql security definer set search_path = ''
as $$
declare
  player_id uuid := auth.uid();
begin
  if player_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  insert into public.player_profiles (id) values (player_id)
    on conflict (id) do nothing;
  return query select p.* from public.player_profiles p where p.id = player_id;
end;
$$;

revoke all on function public.ensure_player_profile() from public, anon, authenticated;
grant execute on function public.ensure_player_profile() to authenticated;
commit;
