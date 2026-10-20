-- Execute after the online battle migration. All fixture data is rolled back.
begin;
insert into auth.users(id) values('bbcf0000-0000-4000-8000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub','bbcf0000-0000-4000-8000-000000000001',true);
select public.claim_collection_starter('alba','bbcf0000-0000-4000-8000-000000000002');
do $$ begin
 begin
 perform public.online_battle_read('bbcf0000-0000-4000-8000-000000000001',null);
 raise exception 'Client could read server-only state';
 exception when insufficient_privilege then null; end;
 begin
 perform public.online_battle_write('bbcf0000-0000-4000-8000-000000000001','bbcf0000-0000-4000-8000-000000000003','{}',null);
 raise exception 'Client could write server-only state';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
 perform public.online_battle_read('bbcf0000-0000-4000-8000-000000000001',null);
 raise exception 'Anonymous read allowed';
 exception when insufficient_privilege then null; end;
end $$;
set local role service_role;
do $$
declare uid uuid:='bbcf0000-0000-4000-8000-000000000001';
 bid uuid:='bbcf0000-0000-4000-8000-000000000003';
 rid uuid:='bbcf0000-0000-4000-8000-000000000004';
 state jsonb; command jsonb; first jsonb; replay jsonb;
begin
 -- Minimal trusted-server fixture checks SQL bookkeeping, not the TypeScript engine.
 state:=jsonb_build_object('battle',jsonb_build_object('battleId',bid,'phase','selection','result',null));
 perform public.online_battle_write(uid,bid,
 '{"kind":"start","cardIds":["base1-44","base1-46","base1-63","base1-58","base1-52","base2-51"]}',state);
 state:=jsonb_set(state,'{battle,phase}','"finished"');
 state:=jsonb_set(state,'{battle,result}','{"kind":"win","winner":0,"reason":"knockout"}');
 command:=jsonb_build_object('kind','turn','battleId',bid,'expectedRevision',0,'action',jsonb_build_object('kind','pass'));
 first:=public.online_battle_write(uid,rid,command,state);
 replay:=public.online_battle_write(uid,rid,command,state);
 if first<>replay or (first->>'coins')::integer<>50 or (first#>>'{match,reward}')::integer<>50 then
 raise exception 'Exactly-once reward failed'; end if;
end $$;
rollback;
select 'online battles: permissions and exactly-once rewards passed' as result;
