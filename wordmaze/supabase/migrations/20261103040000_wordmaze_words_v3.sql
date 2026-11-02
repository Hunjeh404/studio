-- v3: 20 fruits + 30 animals. Each stage has a fixed word set (src/lib/game.ts stageWords); only the order changes per run.
-- Records and runs move to version wordmaze-browser-v3, so v2 records stay separate.
alter table wordmaze_private.runs alter column version set default 'wordmaze-browser-v3';
update wordmaze_private.stages set targets='["apple","banana","cat","dog","pig","duck"]'::jsonb where stage=1;
update wordmaze_private.stages set targets='["kiwi","lemon","mango","cow","fish","bee","fox"]'::jsonb where stage=2;
update wordmaze_private.stages set targets='["melon","owl","orange","cherry","tomato","panda","sheep","horse"]'::jsonb where stage=3;
update wordmaze_private.stages set targets='["peach","bat","coconut","lime","monkey","koala","zebra","tiger","mouse"]'::jsonb where stage=4;
update wordmaze_private.stages set targets='["pear","whale","grape","strawberry","blueberry","frog","turtle","dolphin","giraffe","octopus"]'::jsonb where stage=5;
update wordmaze_private.stages set targets='["olive","snake","pineapple","watermelon","avocado","frog","squirrel","elephant","butterfly","crocodile","kangaroo"]'::jsonb where stage=6;
create or replace function wordmaze_private.run_json(r wordmaze_private.runs) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',r.id,'stage',r.stage,'accent',r.accent,'animal',r.animal,'progress',r.progress,'startedAt',r.started_at,'creditMs',r.credit_ms,'pauseUntil',r.pause_until,'pauseMs',r.pause_ms,'abilityUsed',r.ability_used,'passiveUsed',r.passive_used,'streak',r.streak,'streakBonuses',r.streak_bonuses,'complete',r.completed_at is not null,'elapsed',coalesce(r.elapsed_ms,0),'targets',r.targets);
$$;
-- Only this private, authenticated transaction can mutate balances or grant inventory.
create or replace function wordmaze_private.api(op text,args jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); p wordmaze_private.players; r wordmaze_private.runs; a text; cost integer; n bigint:=floor(extract(epoch from clock_timestamp())*1000); vstage integer; vaccent text; idx integer; heard text; word text; ok boolean:=false; rescued boolean:=false; skill boolean:=false; improved boolean:=false; first_record boolean:=false; old_time bigint; reward integer:=0; tip text:=''; answer jsonb; base jsonb; ord jsonb;
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
   -- The stage word set is fixed; the client may only propose an order of exactly those words, otherwise the server shuffles.
   select s.targets into base from wordmaze_private.stages s where s.stage=vstage;
   ord:=args->'order';
   if ord is null or jsonb_typeof(ord)<>'array' or jsonb_array_length(ord)<>jsonb_array_length(base)
      or (select array_agg(x order by x) from jsonb_array_elements_text(ord) x) is distinct from (select array_agg(x order by x) from jsonb_array_elements_text(base) x) then
    ord:=(select jsonb_agg(x order by random()) from jsonb_array_elements(base) x);
   end if;
   insert into wordmaze_private.runs(user_id,stage,accent,animal,name,targets,started_at,version) values(u,vstage,vaccent,p.animal,p.name,ord,n,'wordmaze-browser-v3') returning * into r;
   return jsonb_build_object('run',wordmaze_private.run_json(r),'player',wordmaze_private.state(u),'serverNow',n);
  end if;
  return jsonb_build_object('player',wordmaze_private.state(u));
 end if;
 if op='records' then
  vstage:=(args->>'stage')::integer;vaccent:=args->>'accent';a:=args->>'animal';
  return jsonb_build_object('records',coalesce((select jsonb_agg(row_to_json(t)) from (select name,time_ms as "timeMs",animal from wordmaze_private.records where stage=vstage and accent=vaccent and animal=a and version='wordmaze-browser-v3' order by time_ms limit 10)t),'[]'::jsonb));
 end if;
 if op not in ('recognize','ability') then raise exception '허용되지 않은 요청입니다.'; end if;
 select * into r from wordmaze_private.runs where id=(args->>'id')::uuid and user_id=u for update;
 if not found or n-r.started_at>1800000 or r.version<>'wordmaze-browser-v3' then raise exception '게임이 종료되었습니다. 다시 시작해 주세요.'; end if;
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
  ok:=heard=word or (word in ('pineapple','watermelon','blueberry','butterfly') and replace(heard,' ','')=word);
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
   tip:=case when heard='' then '단어가 들리지 않습니다. 다시 말해 주세요.' else '“'||heard||'”로 들렸습니다. 단어만 다시 말해 주세요.' end;
  end if;
 end if;
 r.attempts:=r.attempts+1;
 if ok then r.progress:=r.progress+1;if tip='' then tip:='통과했습니다. 다음 단어를 만나 보세요.'; end if; end if;
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
