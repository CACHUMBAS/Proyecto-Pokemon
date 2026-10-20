-- Server-only PvE persistence. Apply after 202610200001_collection.sql.
begin;
create table lumemon_internal.online_battles (
 user_id uuid not null references public.player_wallets(user_id) on delete cascade,
 id uuid not null, revision integer not null default 0 check(revision>=0),
 status text not null check(status in ('active','finished','abandoned')),
 session jsonb not null,
 reward integer not null default 0 check(reward in (0,50)),
 created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,id),
 check(session #>> '{battle,battleId}' = id::text)
);
create unique index online_battles_one_active on lumemon_internal.online_battles(user_id) where status='active';
create table lumemon_internal.online_battle_commands (
 user_id uuid not null, request_id uuid not null, battle_id uuid not null,
 command jsonb not null, created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,request_id),
 foreign key(user_id,battle_id) references lumemon_internal.online_battles(user_id,id) on delete cascade
);
revoke all on lumemon_internal.online_battles, lumemon_internal.online_battle_commands from public, anon, authenticated, service_role;

-- The wallet lock is shared with collection purchases. Read and write see a consistent receipt/balance.
create function public.online_battle_read(p_user_id uuid, p_request_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_wallet public.player_wallets; v_match lumemon_internal.online_battles;
 v_receipt lumemon_internal.online_battle_commands;
begin
 select * into v_wallet from public.player_wallets where user_id=p_user_id for update;
 select * into v_receipt from lumemon_internal.online_battle_commands
 where user_id=p_user_id and request_id=p_request_id;
 if found then
  select * into v_match from lumemon_internal.online_battles where user_id=p_user_id and id=v_receipt.battle_id;
 else
  select * into v_match from lumemon_internal.online_battles where user_id=p_user_id
   order by (status='active') desc, created_at desc, id desc limit 1;
 end if;
 return jsonb_build_object(
 'user_id',p_user_id,'version','lumemon-online-v1','coins',coalesce(v_wallet.coins,0),
 'owned',coalesce((select jsonb_agg(jsonb_build_object('card_id',card_id,'quantity',quantity) order by card_id)
    from public.player_inventory where user_id=p_user_id),'[]'::jsonb),
 'match',case when v_match.id is null then null else
   jsonb_build_object('id',v_match.id,'revision',v_match.revision,'status',v_match.status,
                     'session',v_match.session,'reward',v_match.reward) end,
 'receipt',case when v_receipt.request_id is null then null else
   jsonb_build_object('requestId',v_receipt.request_id,'command',v_receipt.command) end);
end $$;

-- Only trusted server code may supply a calculated session. No browser role can call this function.
create function public.online_battle_write(p_user_id uuid,p_request_id uuid,p_command jsonb,p_session jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_wallet public.player_wallets; v_match lumemon_internal.online_battles;
 v_receipt lumemon_internal.online_battle_commands; v_id uuid; v_kind text;
 v_cards text[]; v_status text; v_reward integer:=0;
begin
 if p_user_id is null or p_request_id is null then raise exception 'invalid_request'; end if;
 select * into v_wallet from public.player_wallets where user_id=p_user_id for update;
 if not found or v_wallet.starter_id is null then raise exception 'starter_required'; end if;
 select * into v_receipt from lumemon_internal.online_battle_commands
 where user_id=p_user_id and request_id=p_request_id;
 if found then
  if v_receipt.command is distinct from p_command then raise exception 'request_conflict'; end if;
  return public.online_battle_read(p_user_id,p_request_id);
 end if;
 v_kind:=p_command->>'kind';
 if v_kind='start' then
  select array_agg(value) into v_cards from jsonb_array_elements_text(p_command->'cardIds');
  if coalesce(array_length(v_cards,1),0)<>6
    or (select count(distinct c.species_id) from public.player_inventory i
        join public.collection_cards c using(card_id)
        where i.user_id=p_user_id and i.card_id=any(v_cards))<>6 then
   raise exception 'invalid_team';
  end if;
  if exists(select 1 from lumemon_internal.online_battles where user_id=p_user_id and status='active') then
   raise exception 'active_battle';
  end if;
  if p_session is null or p_session #>> '{battle,phase}' is distinct from 'selection'
    or p_session #> '{battle,result}' is distinct from 'null'::jsonb then raise exception 'invalid_state'; end if;
  v_id:=p_request_id;
  insert into lumemon_internal.online_battles(user_id,id,status,session) values(p_user_id,v_id,'active',p_session);
 elsif v_kind in ('turn','replace','abandon') then
  v_id:=(p_command->>'battleId')::uuid;
  select * into v_match from lumemon_internal.online_battles where user_id=p_user_id and id=v_id for update;
  if not found or v_match.status<>'active' or v_match.revision is distinct from (p_command->>'expectedRevision')::integer then
   raise exception 'battle_conflict';
  end if;
  if v_kind='abandon' then
   v_status:='abandoned'; p_session:=v_match.session;
  else
   if p_session is null or p_session #>> '{battle,battleId}' is distinct from v_id::text then raise exception 'invalid_state'; end if;
   v_status:=case when p_session #>> '{battle,phase}'='finished' then 'finished' else 'active' end;
   if v_status='finished' and p_session #>> '{battle,result,kind}'='win' and p_session #>> '{battle,result,winner}'='0' then
    v_reward:=50;
   end if;
  end if;
  update lumemon_internal.online_battles set session=p_session,status=v_status,revision=revision+1,reward=v_reward
   where user_id=p_user_id and id=v_id;
  if v_reward>0 then
   if v_wallet.coins>999999950 then raise exception 'balance_limit'; end if;
   update public.player_wallets set coins=coins+v_reward,revision=revision+1 where user_id=p_user_id;
  end if;
 else raise exception 'invalid_request';
 end if;
 insert into lumemon_internal.online_battle_commands(user_id,request_id,battle_id,command)
 values(p_user_id,p_request_id,v_id,p_command);
 return public.online_battle_read(p_user_id,p_request_id);
end $$;
revoke all on function public.online_battle_read(uuid,uuid) from public,anon,authenticated;
revoke all on function public.online_battle_write(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.online_battle_read(uuid,uuid) to service_role;
grant execute on function public.online_battle_write(uuid,uuid,jsonb,jsonb) to service_role;
commit;
