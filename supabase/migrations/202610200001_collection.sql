-- Lumemon economy v1. Review and run once after player_profiles.
-- Server-owned ownership, balances, randomness and idempotent receipts.
begin;
create schema if not exists lumemon_internal;
revoke all on schema lumemon_internal from public, anon, authenticated;
create table public.collection_cards (
  card_id text primary key,
  species_id integer not null check (species_id > 0),
  budget integer not null check (budget in (240,252,264,276,288)),
  fragment_value integer not null check (fragment_value > 0)
);
create table public.collection_starters (
  id text primary key,
  card_ids text[] not null check (cardinality(card_ids)=6)
);
create table public.collection_packs (
  id text primary key,
  coins integer not null check (coins>0),
  fragments integer not null check (fragments>0),
  size integer not null check (size=3)
);
insert into public.collection_cards values
 ('base1-44',1,240,5),
 ('sv03.5-166',1,276,40),
 ('base1-15',3,264,20),
 ('sv03.5-198',3,288,80),
 ('base1-46',4,240,5),
 ('sv03.5-168',4,276,40),
 ('base1-4',6,264,20),
 ('sv03.5-199',6,288,80),
 ('base1-63',7,240,5),
 ('sv03.5-170',7,276,40),
 ('base1-2',9,264,20),
 ('sv03.5-200',9,288,80),
 ('base1-58',25,240,5),
 ('sv03.5-173',25,276,40),
 ('base1-68',37,240,5),
 ('sv03.5-037',37,240,5),
 ('base2-54',39,240,5),
 ('sv03.5-039',39,240,5),
 ('base1-43',63,240,5),
 ('sv03.5-063',63,240,5),
 ('base1-52',66,240,5),
 ('sv03.5-066',66,240,5),
 ('base1-50',92,240,5),
 ('sv03.5-092',92,240,5),
 ('base3-5',94,264,20),
 ('sv03.5-094',94,264,20),
 ('base1-56',95,240,5),
 ('sv03.5-095',95,252,10),
 ('base3-10',131,264,20),
 ('sv03.5-131',131,252,10),
 ('base2-51',133,240,5),
 ('sv03.5-133',133,240,5),
 ('base2-11',143,264,20),
 ('sv03.5-143',143,252,10),
 ('base3-4',149,264,20),
 ('sv03.5-149',149,264,20),
 ('A4-162',152,276,40),
 ('xy9-1',152,240,5),
 ('A4-165',155,276,40),
 ('swsh10-023',155,240,5),
 ('A4-167',158,276,40),
 ('sv05-039',158,240,5),
 ('sv03-086',196,252,10),
 ('sv08.5-155',196,288,80),
 ('sv03-130',197,252,10),
 ('sv08.5-161',197,288,80),
 ('sv03-141',212,264,20),
 ('sv03-205',212,276,40);
insert into public.collection_starters values
 ('alba',array['base1-44','base1-46','base1-63','base1-58','base1-52','base2-51']),
 ('brasa',array['xy9-1','swsh10-023','sv05-039','base1-43','base1-56','base2-54']),
 ('niebla',array['base1-44','base1-63','base1-68','base1-50','base1-58','base2-51']);
insert into public.collection_packs values ('prisma-v1',100,60,3);

create table public.player_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 coins integer not null default 0 check(coins between 0 and 1000000000),
 fragments integer not null default 0 check(fragments between 0 and 1000000000),
 starter_id text references public.collection_starters(id),
 welcome_available boolean not null default false,
 revision integer not null default 0 check(revision>=0)
);
create table public.player_inventory (
 user_id uuid not null references public.player_wallets(user_id) on delete cascade,
 card_id text not null references public.collection_cards(card_id),
 quantity integer not null check(quantity between 1 and 1000000),
 primary key(user_id,card_id)
);
create table public.player_collection_events (
 user_id uuid not null references public.player_wallets(user_id) on delete cascade,
 request_id uuid not null,
 kind text not null check(kind in ('starter','pack','fragment')),
 arguments jsonb not null,
 response jsonb not null,
 created_at timestamptz not null default clock_timestamp(),
 primary key(user_id,request_id)
);
create index player_collection_events_recent on public.player_collection_events(user_id,created_at desc,request_id);

alter table public.collection_cards enable row level security;
alter table public.collection_starters enable row level security;
alter table public.collection_packs enable row level security;
alter table public.player_wallets enable row level security;
alter table public.player_inventory enable row level security;
alter table public.player_collection_events enable row level security;
revoke all on table public.collection_cards,public.collection_starters,public.collection_packs,
 public.player_wallets,public.player_inventory,public.player_collection_events from public,anon,authenticated;
grant select on table public.collection_cards,public.collection_starters,public.collection_packs,
 public.player_wallets,public.player_inventory,public.player_collection_events to authenticated;
create policy collection_cards_read on public.collection_cards for select to authenticated using(true);
create policy collection_starters_read on public.collection_starters for select to authenticated using(true);
create policy collection_packs_read on public.collection_packs for select to authenticated using(true);
create policy wallet_own on public.player_wallets for select to authenticated using((select auth.uid())=user_id);
create policy inventory_own on public.player_inventory for select to authenticated using((select auth.uid())=user_id);
create policy events_own on public.player_collection_events for select to authenticated using((select auth.uid())=user_id);

create function public.get_player_collection() returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();
 w public.player_wallets%rowtype;
 result jsonb;
begin
 if uid is null then raise exception 'authentication_required' using errcode='28000'; end if;
 insert into public.player_wallets(user_id) values(uid) on conflict(user_id) do nothing;
 -- All economy operations acquire this same lock before reading or writing.
 select * into strict w from public.player_wallets where user_id=uid for update;
 select jsonb_build_object(
  'user_id',uid,'version','lumemon-economy-v1','wallet',to_jsonb(w)-'user_id',
  'inventory',(select coalesce(jsonb_agg(jsonb_build_object('card_id',i.card_id,'quantity',i.quantity) order by i.card_id),'[]'::jsonb) from public.player_inventory i where i.user_id=uid),
  'cards',(select jsonb_agg(to_jsonb(c) order by c.card_id) from public.collection_cards c),
  'starters',(select jsonb_agg(to_jsonb(s) order by s.id) from public.collection_starters s),
  'pack',(select to_jsonb(p)||jsonb_build_object('odds',(
    select jsonb_agg(jsonb_build_object('budget',d.budget,'weight',d.weight,'card_count',(select count(*) from public.collection_cards c where c.budget=d.budget)) order by d.budget)
    from (values(240,6000),(252,2500),(264,1000),(276,400),(288,100)) d(budget,weight)
   )) from public.collection_packs p where p.id='prisma-v1'),
  'events',(select coalesce(jsonb_agg(e.response order by e.created_at desc,e.request_id),'[]'::jsonb)
    from (select response,created_at,request_id from public.player_collection_events where user_id=uid order by created_at desc,request_id limit 20) e)
 ) into result;
 return result;
end;
$$;

create function lumemon_internal.apply_collection_operation(op text,request uuid,args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();
 w public.player_wallets%rowtype;
 previous public.player_collection_events%rowtype;
 p public.collection_packs%rowtype;
 selected text[];
 reference text;
 payment text;
 n integer;
 owned integer;
 value_per_copy integer;
 coin_delta integer:=0;
 fragment_delta integer:=0;
 chosen text;
 target_budget integer;
 draw integer;
 receipt jsonb;
begin
 if uid is null then raise exception 'authentication_required' using errcode='28000'; end if;
 if request is null then raise exception 'invalid_request' using errcode='22023'; end if;
 if op not in ('starter','pack','fragment') then raise exception 'invalid_operation' using errcode='22023'; end if;
 insert into public.player_wallets(user_id) values(uid) on conflict(user_id) do nothing;
 select * into strict w from public.player_wallets where user_id=uid for update;
 select * into previous from public.player_collection_events where user_id=uid and request_id=request;
 if found then
   if previous.kind<>op or previous.arguments<>args then raise exception 'request_conflict' using errcode='22023'; end if;
   return previous.response;
 end if;
 if op='starter' then
   reference:=args->>'starter_id';
   select card_ids into selected from public.collection_starters where id=reference;
   if not found then raise exception 'unknown_starter' using errcode='22023'; end if;
   if w.starter_id is not null then raise exception 'starter_claimed' using errcode='P0001'; end if;
   update public.player_wallets set starter_id=reference,welcome_available=true where user_id=uid;
   n:=6;
 elsif op='pack' then
   if w.starter_id is null then raise exception 'starter_required' using errcode='P0001'; end if;
   reference:=args->>'pack_id';
   payment:=args->>'currency';
   select * into p from public.collection_packs where id=reference;
   if not found then raise exception 'unknown_pack' using errcode='22023'; end if;
   if payment is null or payment not in ('welcome','coins','fragments') then raise exception 'invalid_currency' using errcode='22023'; end if;
   if payment='welcome' then
     if not w.welcome_available then raise exception 'welcome_used' using errcode='P0001'; end if;
     update public.player_wallets set welcome_available=false where user_id=uid;
   elsif payment='coins' then
     if w.coins<p.coins then raise exception 'insufficient_balance' using errcode='P0001'; end if;
     coin_delta:=-p.coins;
   else
     if w.fragments<p.fragments then raise exception 'insufficient_balance' using errcode='P0001'; end if;
     fragment_delta:=-p.fragments;
   end if;
   selected:=array[]::text[];
   for n in 1..p.size loop
     draw:=floor(pg_catalog.random()*10000)::integer;
     target_budget:=case when draw<6000 then 240 when draw<8500 then 252 when draw<9500 then 264 when draw<9900 then 276 else 288 end;
     select card_id into chosen from public.collection_cards where budget=target_budget order by pg_catalog.random() limit 1;
     if chosen is null then raise exception 'invalid_pack_pool' using errcode='P0001'; end if;
     selected:=array_append(selected,chosen);
   end loop;
   n:=p.size;
 else
   if w.starter_id is null then raise exception 'starter_required' using errcode='P0001'; end if;
   reference:=args->>'card_id';
   n:=(args->>'quantity')::integer;
   if n is null or n<1 or n>1000000 then raise exception 'invalid_quantity' using errcode='22023'; end if;
   select fragment_value into value_per_copy from public.collection_cards where card_id=reference;
   if not found then raise exception 'unknown_card' using errcode='22023'; end if;
   select quantity into owned from public.player_inventory where user_id=uid and card_id=reference;
   if owned is null or owned-n<1 then raise exception 'last_copy' using errcode='P0001'; end if;
   update public.player_inventory set quantity=quantity-n where user_id=uid and card_id=reference;
   fragment_delta:=n*value_per_copy;
   selected:=array[reference];
 end if;
 if op in ('starter','pack') then
   insert into public.player_inventory(user_id,card_id,quantity)
    select uid,s.card_id,count(*)::integer from unnest(selected) s(card_id) group by s.card_id
    on conflict(user_id,card_id) do update set quantity=public.player_inventory.quantity+excluded.quantity;
 end if;
 update public.player_wallets set coins=coins+coin_delta,fragments=fragments+fragment_delta,revision=revision+1 where user_id=uid;
 receipt:=jsonb_build_object('user_id',uid,'request_id',request,'kind',op,'reference',reference,'currency',payment,
  'card_ids',selected,'quantity',n,'coins_delta',coin_delta,'fragments_delta',fragment_delta,'created_at',clock_timestamp());
 insert into public.player_collection_events(user_id,request_id,kind,arguments,response)
  values(uid,request,op,args,receipt);
 return receipt;
end;
$$;
revoke all on function lumemon_internal.apply_collection_operation(text,uuid,jsonb) from public,anon,authenticated;

create function public.claim_collection_starter(p_starter_id text,p_request_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select lumemon_internal.apply_collection_operation('starter',p_request_id,jsonb_build_object('starter_id',p_starter_id));
$$;
create function public.open_collection_pack(p_pack_id text,p_currency text,p_request_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select lumemon_internal.apply_collection_operation('pack',p_request_id,jsonb_build_object('pack_id',p_pack_id,'currency',p_currency));
$$;
create function public.fragment_collection_card(p_card_id text,p_quantity integer,p_request_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select lumemon_internal.apply_collection_operation('fragment',p_request_id,jsonb_build_object('card_id',p_card_id,'quantity',p_quantity));
$$;
revoke all on function public.get_player_collection(),public.claim_collection_starter(text,uuid),
 public.open_collection_pack(text,text,uuid),public.fragment_collection_card(text,integer,uuid) from public,anon,authenticated;
grant execute on function public.get_player_collection(),public.claim_collection_starter(text,uuid),
 public.open_collection_pack(text,text,uuid),public.fragment_collection_card(text,integer,uuid) to authenticated;
commit;
