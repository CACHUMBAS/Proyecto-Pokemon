-- Run once after the collection migration. Fixtures are rolled back.
-- If anything fails, run ROLLBACK; before retrying.
begin;
insert into auth.users(id) values
 ('aac00000-0000-4000-8000-000000000001'),('aac00000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','aac00000-0000-4000-8000-000000000001',true);
do $$
declare first jsonb; retry jsonb; s jsonb;
begin
 first:=public.claim_collection_starter('alba','aac00000-0000-4000-8000-000000000011');
 retry:=public.claim_collection_starter('alba','aac00000-0000-4000-8000-000000000011');
 if first<>retry then raise exception 'Starter replay differs'; end if;
 first:=public.open_collection_pack('prisma-v1','welcome','aac00000-0000-4000-8000-000000000012');
 retry:=public.open_collection_pack('prisma-v1','welcome','aac00000-0000-4000-8000-000000000012');
 if first<>retry then raise exception 'Pack replay differs'; end if;
 s:=public.get_player_collection();
 if (select sum((i->>'quantity')::int) from jsonb_array_elements(s->'inventory') i)<>9 then raise exception 'Inventory grant differs'; end if;
 if (s->'wallet'->>'coins')::int<>0 or (s->'wallet'->>'welcome_available')::boolean then raise exception 'Wallet differs'; end if;
 begin
   perform public.open_collection_pack('prisma-v1','welcome','aac00000-0000-4000-8000-000000000013');
   raise exception 'Welcome granted twice';
 exception when raise_exception then if sqlerrm<>'welcome_used' then raise; end if; end;
 begin
   perform public.open_collection_pack('prisma-v1','coins','aac00000-0000-4000-8000-000000000014');
   raise exception 'Overspending allowed';
 exception when raise_exception then if sqlerrm<>'insufficient_balance' then raise; end if; end;
 begin
   update public.player_wallets set coins=10000;
   raise exception 'Direct balance update allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','aac00000-0000-4000-8000-000000000002',true);
select public.get_player_collection();
do $$ begin
 if (select count(*) from public.player_wallets)<>1 then raise exception 'Wallet isolation failed'; end if;
 if exists(select 1 from public.player_inventory) or exists(select 1 from public.player_collection_events) then raise exception 'Inventory or events leaked'; end if;
 begin
  delete from public.player_inventory;
  raise exception 'Inventory deletion allowed';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
  perform public.get_player_collection();
  raise exception 'Anonymous RPC allowed';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'collection: isolation, atomicity and idempotency passed' as result;
