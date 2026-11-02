-- Wordmaze uses the existing Auth project, with an isolated wallet and inventory.
create schema if not exists wordmaze_private;
revoke all on schema wordmaze_private from public,anon;
grant usage on schema wordmaze_private to authenticated;
create table wordmaze_private.players(user_id uuid primary key references auth.users(id) on delete cascade,name text not null default '친구' check(char_length(name) between 1 and 12),balance integer not null default 0 check(balance>=0),animal text not null default 'cat');
create table wordmaze_private.animals(id text primary key,price integer not null check(price>=0));
create table wordmaze_private.inventory(user_id uuid references auth.users(id) on delete cascade,animal text references wordmaze_private.animals(id),primary key(user_id,animal));
create table wordmaze_private.stages(stage integer primary key,targets jsonb not null);
create table wordmaze_private.runs(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,stage integer not null references wordmaze_private.stages(stage),accent text not null check(accent in ('en-GB','en-US')),animal text not null references wordmaze_private.animals(id),name text not null,targets jsonb not null,progress integer not null default 0,started_at bigint not null,credit_ms integer not null default 0,pause_until bigint not null default 0,pause_ms integer not null default 0,ability_used boolean not null default false,passive_used boolean not null default false,streak integer not null default 0,streak_bonuses integer not null default 0,attempts integer not null default 0,completed_at bigint,elapsed_ms bigint,last_response jsonb,version text not null default 'wordmaze-browser-v2');
create table wordmaze_private.records(user_id uuid references auth.users(id) on delete cascade,stage integer not null,accent text not null,animal text not null,time_ms bigint not null check(time_ms>=0),name text not null,version text not null,primary key(user_id,stage,accent,animal,version));
create table wordmaze_private.ledger(run_id uuid primary key references wordmaze_private.runs(id),user_id uuid not null references auth.users(id) on delete cascade,amount integer not null check(amount>0));
create index wordmaze_runs_user_started on wordmaze_private.runs(user_id,started_at desc);
create index wordmaze_records_rank on wordmaze_private.records(stage,accent,animal,version,time_ms);
alter table wordmaze_private.players enable row level security;
alter table wordmaze_private.animals enable row level security;
alter table wordmaze_private.inventory enable row level security;
alter table wordmaze_private.stages enable row level security;
alter table wordmaze_private.runs enable row level security;
alter table wordmaze_private.records enable row level security;
alter table wordmaze_private.ledger enable row level security;
revoke all on all tables in schema wordmaze_private from public,anon,authenticated;

create function wordmaze_private.state(u uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('name',p.name,'balance',p.balance,'animal',p.animal,'owned',coalesce((select jsonb_agg(i.animal order by i.animal) from wordmaze_private.inventory i where i.user_id=u),'[]'::jsonb)) from wordmaze_private.players p where p.user_id=u;
$$;
create function wordmaze_private.run_json(r wordmaze_private.runs) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',r.id,'stage',r.stage,'accent',r.accent,'animal',r.animal,'progress',r.progress,'startedAt',r.started_at,'creditMs',r.credit_ms,'pauseUntil',r.pause_until,'pauseMs',r.pause_ms,'abilityUsed',r.ability_used,'passiveUsed',r.passive_used,'streak',r.streak,'streakBonuses',r.streak_bonuses,'complete',r.completed_at is not null,'elapsed',coalesce(r.elapsed_ms,0));
$$;
-- Only this private, authenticated transaction can mutate balances or grant inventory.
create function wordmaze_private.api(op text,args jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); p wordmaze_private.players; r wordmaze_private.runs; a text; cost integer; n bigint:=floor(extract(epoch from clock_timestamp())*1000); vstage integer; vaccent text; idx integer; heard text; word text; ok boolean:=false; rescued boolean:=false; skill boolean:=false; improved boolean:=false; first_record boolean:=false; old_time bigint; reward integer:=0; tip text:=''; answer jsonb;
begin
 if u is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception '로그인 후 이용해 주세요.' using errcode='42501'; end if;
 if op='bootstrap' then
  insert into wordmaze_private.players(user_id) values(u) on conflict do nothing;
  insert into wordmaze_private.inventory(user_id,animal) values(u,'cat') on conflict do nothing;
  return jsonb_build_object('player',wordmaze_private.state(u));
 end if;
 if op in ('name','buy','equip','start') then
  select * into p from wordmaze_private.players where user_id=u for update;
  if not found then raise exception '다시 로그인해 주세요.'; end if;
  if op='name' then
   a:=btrim(regexp_replace(coalesce(args->>'name',''),'[<>[:cntrl:]]','','g'));
   if char_length(a)<1 or char_length(a)>12 then raise exception '이름은 1~12글자로 입력해 주세요.'; end if;
   update wordmaze_private.players set name=a where user_id=u;
  elsif op='buy' then
   a:=args->>'animal';select price into cost from wordmaze_private.animals where id=a;
   if not found then raise exception '동물친구를 확인해 주세요.'; end if;
   if not exists(select 1 from wordmaze_private.inventory where user_id=u and animal=a) then
    if p.balance<cost then raise exception '별빛이 부족합니다.'; end if;
    update wordmaze_private.players set balance=balance-cost where user_id=u;
    insert into wordmaze_private.inventory(user_id,animal) values(u,a);
   end if;
  elsif op='equip' then
   a:=args->>'animal';if not exists(select 1 from wordmaze_private.inventory where user_id=u and animal=a) then raise exception '먼저 이 동물친구를 구매해 주세요.'; end if;
   update wordmaze_private.players set animal=a where user_id=u;
  else
   vstage:=(args->>'stage')::integer;vaccent:=args->>'accent';
   if vstage not between 1 and 6 or vstage is null or vaccent not in ('en-GB','en-US') or vaccent is null then raise exception '게임 설정을 확인해 주세요.'; end if;
   if (select count(*) from wordmaze_private.runs where user_id=u and started_at>n-3600000)>=60 then raise exception '잠시 쉬었다 다시 시작해 주세요.'; end if;
   if not exists(select 1 from wordmaze_private.inventory where user_id=u and animal=p.animal) then raise exception '동물친구를 다시 선택해 주세요.'; end if;
   insert into wordmaze_private.runs(user_id,stage,accent,animal,name,targets,started_at) select u,vstage,vaccent,p.animal,p.name,s.targets,n from wordmaze_private.stages s where s.stage=vstage returning * into r;
   return jsonb_build_object('run',wordmaze_private.run_json(r),'player',wordmaze_private.state(u),'serverNow',n);
  end if;
  return jsonb_build_object('player',wordmaze_private.state(u));
 end if;
 if op='records' then
  vstage:=(args->>'stage')::integer;vaccent:=args->>'accent';a:=args->>'animal';
  return jsonb_build_object('records',coalesce((select jsonb_agg(row_to_json(t)) from (select name,time_ms as "timeMs",animal from wordmaze_private.records where stage=vstage and accent=vaccent and animal=a and version='wordmaze-browser-v2' order by time_ms limit 10)t),'[]'::jsonb));
 end if;
 if op not in ('recognize','ability') then raise exception '허용되지 않은 요청입니다.'; end if;
 select * into r from wordmaze_private.runs where id=(args->>'id')::uuid and user_id=u for update;
 if not found or n-r.started_at>1800000 or r.version<>'wordmaze-browser-v2' then raise exception '게임이 종료되었습니다. 다시 시작해 주세요.'; end if;
 idx:=(args->>'progress')::integer;
 if idx=r.progress-1 and r.last_response is not null then return r.last_response; end if;
 if r.completed_at is not null or idx is null or idx<>r.progress then raise exception '현재 문제를 다시 확인해 주세요.'; end if;
 if op='ability' and r.animal='bear' and r.ability_used then return jsonb_build_object('run',wordmaze_private.run_json(r),'pass',false,'tip','쉼표 능력을 이미 사용했습니다.','serverNow',n); end if;
 if n<r.pause_until then raise exception '쉼표 시간이 끝난 뒤 말해 주세요.'; end if;
 if r.attempts>=120 then raise exception '이번 도전의 말하기 횟수를 모두 사용했습니다.'; end if;
 word:=r.targets->>r.progress;
 if op='ability' then
  if r.ability_used then raise exception '이번 도전의 능력을 이미 사용했습니다.'; end if;
  if r.animal='bear' then
   update wordmaze_private.runs set ability_used=true,pause_until=n+5000,pause_ms=pause_ms+5000 where id=r.id returning * into r;
   return jsonb_build_object('run',wordmaze_private.run_json(r),'pass',false,'tip','5초 동안 쉬어 가세요. 시간은 멈춥니다.','serverNow',n);
  end if;
  if r.animal<>'rabbit' and not(r.animal='lion' and r.progress=jsonb_array_length(r.targets)-1) then raise exception '지금 사용할 수 없는 능력입니다.'; end if;
  r.ability_used:=true;ok:=true;skill:=true;tip:='동물친구의 능력으로 한 칸 통과했습니다.';
 else
  if char_length(coalesce(args->>'transcript',''))>120 then raise exception '인식 결과가 너무 깁니다.'; end if;
  heard:=btrim(regexp_replace(regexp_replace(lower(coalesce(args->>'transcript','')),'[.,!?;:。！？]','','g'),'\s+',' ','g'));
  ok:=heard=word or (word='pineapple' and heard='pine apple') or (word='watermelon' and heard='water melon');
  if not ok and heard<>'' and r.animal='lioness' and not r.passive_used then ok:=true;rescued:=true;r.passive_used:=true;tip:='암사자가 첫 오답을 지켜 주었습니다. 한 칸 통과했습니다.'; end if;
  if ok and not rescued then
   r.streak:=r.streak+1;
   if r.animal='cat' and r.progress=0 then r.credit_ms:=r.credit_ms+1500; end if;
   if r.animal='penguin' then r.credit_ms:=r.credit_ms+250; end if;
   if r.animal='tiger' and r.streak%3=0 and r.streak_bonuses<2 then r.credit_ms:=r.credit_ms+2000;r.streak_bonuses:=r.streak_bonuses+1; end if;
   if r.animal='otter' and not r.passive_used and char_length(word)>=6 then r.credit_ms:=r.credit_ms+3000;r.passive_used:=true; end if;
  elsif not ok then
   r.streak:=0;
   if r.animal='dog' and not r.passive_used and heard<>'' then r.credit_ms:=r.credit_ms+2000;r.passive_used:=true; end if;
   tip:=case when heard='' then '단어가 들리지 않습니다. 다시 말해 주세요.' else '“'||heard||'”로 들렸습니다. 과일 이름만 다시 말해 주세요.' end;
  end if;
 end if;
 r.attempts:=r.attempts+1;
 if ok then r.progress:=r.progress+1;if tip='' then tip:='통과했습니다. 다음 과일을 만나 보세요.'; end if; end if;
 r.elapsed_ms:=greatest(0,n-r.started_at-r.credit_ms-r.pause_ms);
 if r.progress=jsonb_array_length(r.targets) then
  -- Serialize rewards, purchases, and personal records on the same player lock.
  perform 1 from wordmaze_private.players where user_id=u for update;
  select time_ms into old_time from wordmaze_private.records where user_id=u and stage=r.stage and accent=r.accent and animal=r.animal and version=r.version;
  first_record:=old_time is null;improved:=old_time is not null and r.elapsed_ms<old_time;
  reward:=10+r.stage*2+case when r.animal='calico' then 5 else 0 end+case when improved then 10 else 0 end;
  insert into wordmaze_private.ledger(run_id,user_id,amount) values(r.id,u,reward);
  update wordmaze_private.players set balance=balance+reward where user_id=u;
  if first_record or improved then
   insert into wordmaze_private.records(user_id,stage,accent,animal,time_ms,name,version) values(u,r.stage,r.accent,r.animal,r.elapsed_ms,r.name,r.version) on conflict(user_id,stage,accent,animal,version) do update set time_ms=excluded.time_ms,name=excluded.name;
  end if;
  r.completed_at:=n;
 end if;
 answer:=jsonb_build_object('run',wordmaze_private.run_json(r),'pass',ok,'tip',tip,'newBest',improved,'record',first_record or improved,'reward',reward,'player',wordmaze_private.state(u),'serverNow',n);
 update wordmaze_private.runs set progress=r.progress,credit_ms=r.credit_ms,ability_used=r.ability_used,passive_used=r.passive_used,streak=r.streak,streak_bonuses=r.streak_bonuses,attempts=r.attempts,completed_at=r.completed_at,elapsed_ms=r.elapsed_ms,last_response=answer where id=r.id;
 return answer;
end;
$$;
create function public.wordmaze_api(op text,args jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select wordmaze_private.api(op,args); $$;
revoke all on all functions in schema wordmaze_private from public,anon,authenticated;
grant execute on function wordmaze_private.api(text,jsonb) to authenticated;
revoke all on function public.wordmaze_api(text,jsonb) from public,anon;
grant execute on function public.wordmaze_api(text,jsonb) to authenticated;

insert into wordmaze_private.animals(id,price) values
('cat',0),
('bear',60),
('rabbit',90),
('dog',70),
('tiger',120),
('penguin',100),
('poodle',80),
('siamese',80),
('calico',110),
('lioness',150),
('lion',140),
('otter',100);
insert into wordmaze_private.stages(stage,targets) values
(1,'["pear","apple","peach","lemon","strawberry","orange"]'::jsonb),
(2,'["pear","watermelon","pineapple","cherry","mango","melon","apple"]'::jsonb),
(3,'["peach","orange","pineapple","pear","banana","apple","mango","kiwi"]'::jsonb),
(4,'["pineapple","lemon","grape","strawberry","peach","orange","watermelon","melon","banana"]'::jsonb),
(5,'["pineapple","mango","kiwi","banana","apple","grape","lemon","peach","pear","orange"]'::jsonb),
(6,'["strawberry","mango","watermelon","kiwi","lemon","orange","apple","pear","pineapple","grape","peach"]'::jsonb);
