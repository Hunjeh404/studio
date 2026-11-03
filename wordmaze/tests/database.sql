begin;
-- Synthetic users and every test write are rolled back before this query returns.
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();
begin
 insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data) values(a,'authenticated','authenticated','wordmaze-test-a@example.invalid','{}','{}'),(b,'authenticated','authenticated','wordmaze-test-b@example.invalid','{}','{}');
 insert into wordmaze_private.players(user_id,name,balance) values(a,'검증A',1000),(b,'검증B',100);
 insert into wordmaze_private.inventory(user_id,animal) select a,id from wordmaze_private.animals;
 insert into wordmaze_private.inventory(user_id,animal) values(b,'cat');
 insert into wordmaze_private.records(user_id,stage,accent,difficulty,animal,time_ms,name,version) select a,1,'en-GB','normal',id,1000000,'검증A','wordmaze-azure-v5' from wordmaze_private.animals where id<>'cat';
 perform set_config('wordmaze.test_a',a::text,true);perform set_config('wordmaze.test_b',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
end $$;
-- Runs as the database owner so it can play the Edge Function's role; privileges are asserted explicitly below.
do $$
declare a text;d jsonb;r jsonb;words jsonb;run_id text;i integer;balance_before integer;expected_credit integer;last_request jsonb;other_id text;
begin
 if has_table_privilege('authenticated','wordmaze_private.players','UPDATE') or has_table_privilege('anon','wordmaze_private.players','SELECT') then raise exception 'direct table privilege leak';end if;
 if has_function_privilege('anon','public.wordmaze_api(text,jsonb)','EXECUTE') then raise exception 'anonymous RPC access leak';end if;
 if has_function_privilege('authenticated','public.wordmaze_judge(uuid,jsonb)','EXECUTE') or has_function_privilege('anon','public.wordmaze_judge(uuid,jsonb)','EXECUTE') then raise exception 'judge callable by clients';end if;
 if not has_function_privilege('service_role','public.wordmaze_judge(uuid,jsonb)','EXECUTE') then raise exception 'judge not callable by the Edge Function';end if;
 -- Clients cannot submit their own verdicts: the old transcript op and a direct judge op are both refused.
 d:=public.wordmaze_api('start','{"stage":5,"accent":"en-GB"}');run_id:=d->'run'->>'id';words:=d->'run'->'targets';
 begin perform public.wordmaze_api('recognize',jsonb_build_object('id',run_id,'progress',0,'transcript',words->>0));raise exception 'transcript op allowed';exception when others then if sqlerrm='transcript op allowed' then raise;end if;end;
 begin perform public.wordmaze_api('judge',jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',100,'spoken',true));raise exception 'client judge allowed';exception when others then if sqlerrm='client judge allowed' then raise;end if;end;
 begin perform public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word','zzz','score',100,'spoken',true));raise exception 'wrong reference word allowed';exception when others then if sqlerrm='wrong reference word allowed' then raise;end if;end;
 -- Stage 5 needs 80: 79 fails, silence fails, 80 passes.
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',79,'spoken',true));if (d->>'pass')::boolean or (d->>'threshold')::int<>80 then raise exception 'stage 5 threshold %',d;end if;
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',99,'spoken',false));if (d->>'pass')::boolean then raise exception 'silence passed';end if;
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',80,'spoken',true));if not (d->>'pass')::boolean then raise exception 'stage 5 pass at 80 %',d;end if;
 -- Difficulty shifts the mark: stage 5 hard needs 90, stage 1 easy needs 50.
 d:=public.wordmaze_api('start','{"stage":5,"accent":"en-US","difficulty":"hard"}');run_id:=d->'run'->>'id';words:=d->'run'->'targets';if d->'run'->>'difficulty'<>'hard' then raise exception 'difficulty not stored';end if;
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',89,'spoken',true));if (d->>'pass')::boolean or (d->>'threshold')::int<>90 then raise exception 'hard mark %',d;end if;
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',90,'spoken',true));if not (d->>'pass')::boolean then raise exception 'hard pass at 90';end if;
 d:=public.wordmaze_api('start','{"stage":1,"accent":"en-GB","difficulty":"easy"}');run_id:=d->'run'->>'id';words:=d->'run'->'targets';
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',49,'spoken',true));if (d->>'pass')::boolean or (d->>'threshold')::int<>50 then raise exception 'easy mark %',d;end if;
 d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',50,'spoken',true));if not (d->>'pass')::boolean then raise exception 'easy pass at 50';end if;
 begin perform public.wordmaze_api('start','{"stage":1,"accent":"en-GB","difficulty":"extreme"}');raise exception 'bad difficulty allowed';exception when others then if sqlerrm='bad difficulty allowed' then raise;end if;end;
 d:=public.wordmaze_api('bootstrap');if jsonb_array_length(d->'player'->'owned')<>12 then raise exception 'inventory bootstrap';end if;
 foreach a in array array['cat','bear','rabbit','dog','tiger','penguin','poodle','siamese','calico','lioness','lion','otter'] loop
  d:=public.wordmaze_api('equip',jsonb_build_object('animal',a));d:=public.wordmaze_api('start',jsonb_build_object('stage',1,'accent','en-GB','order',case when a='cat' then '["duck","pig","dog","cat","banana","apple"]'::jsonb else '["apple","apple","cat","dog","pig","duck"]'::jsonb end));run_id:=d->'run'->>'id';other_id:=run_id;
  -- The word set is fixed by the server; a valid client order is kept, anything else is replaced by a server shuffle.
  words:=d->'run'->'targets';
  if a='cat' and words<>'["duck","pig","dog","cat","banana","apple"]'::jsonb then raise exception 'valid order not kept %',words;end if;
  if (select array_agg(x order by x) from jsonb_array_elements_text(words) x)<>array['apple','banana','cat','dog','duck','pig'] then raise exception 'stage word set changed %',words;end if;i:=0;expected_credit:=0;
  if a='bear' then d:=public.wordmaze_api('ability',jsonb_build_object('id',run_id,'progress',0));if (d->'run'->>'pauseMs')::integer<>5000 then raise exception 'bear pause';end if;d:=public.wordmaze_api('ability',jsonb_build_object('id',run_id,'progress',0));perform pg_sleep(5.05);end if;
  if a='rabbit' then d:=public.wordmaze_api('ability',jsonb_build_object('id',run_id,'progress',0));i:=1;end if;
  if a='lion' then begin perform public.wordmaze_api('ability',jsonb_build_object('id',run_id,'progress',0));raise exception 'lion early ability allowed';exception when others then if sqlerrm='lion early ability allowed' then raise;end if;end;end if;
  if a in ('cat','dog','lioness') then d:=public.wordmaze_judge(auth.uid(),jsonb_build_object('id',run_id,'progress',0,'word',words->>0,'score',20,'spoken',true));if a='lioness' then i:=1;elsif (d->>'pass')::boolean then raise exception 'wrong word passed';end if;end if;
  if a='cat' then expected_credit:=1500;elsif a='dog' then expected_credit:=2000;elsif a='tiger' then expected_credit:=4000;elsif a='penguin' then expected_credit:=jsonb_array_length(words)*250;elsif a='otter' then expected_credit:=3000;end if;
  balance_before:=(public.wordmaze_api('bootstrap')->'player'->>'balance')::integer;
  while i<jsonb_array_length(words) loop
   last_request:=jsonb_build_object('id',run_id,'progress',i,'word',words->>i,'score',95,'spoken',true);
   if a='lion' and i=jsonb_array_length(words)-1 then d:=public.wordmaze_api('ability',last_request);else d:=public.wordmaze_judge(auth.uid(),last_request);end if;
   if not(d->>'pass')::boolean or (d->'run'->>'progress')::integer<>i+1 then raise exception 'progress failed % % %',a,i,d;end if;i:=i+1;
  end loop;
  if not(d->'run'->>'complete')::boolean then raise exception 'completion failed';end if;
  if (d->'run'->>'creditMs')::integer<>expected_credit then raise exception 'credit mismatch % %',a,d;end if;
  if (d->>'reward')::integer<>(12+(case when a='calico' then 5 else 0 end)+(case when a='cat' then 0 else 10 end)) then raise exception 'reward mismatch % %',a,d;end if;
  if (d->'player'->>'balance')::integer<>balance_before+(d->>'reward')::integer then raise exception 'wallet mismatch';end if;
  r:=public.wordmaze_judge(auth.uid(),last_request);if r<>d then raise exception 'duplicate result mismatch';end if;
  if (public.wordmaze_api('bootstrap')->'player'->>'balance')::integer<>(d->'player'->>'balance')::integer then raise exception 'duplicate reward';end if;
 end loop;
 -- Boards: per animal one row each; 'all' keeps only this player's best run across animals (the cat run beat the seeded 1000s rows).
 d:=public.wordmaze_api('records','{"stage":1,"difficulty":"normal","animal":"all"}');if jsonb_array_length(d->'records')<>1 or d->'records'->0->>'animal' is null then raise exception 'all board %',d;end if;
 if (d->'records'->0->>'timeMs')::bigint>=1000000 then raise exception 'all board should show the best run %',d;end if;
 d:=public.wordmaze_api('records','{"stage":1,"difficulty":"normal","animal":"bear"}');if jsonb_array_length(d->'records')<>1 or d->'records'->0->>'animal'<>'bear' then raise exception 'animal board %',d;end if;
 d:=public.wordmaze_api('records','{"stage":1,"difficulty":"hard","animal":"all"}');if jsonb_array_length(d->'records')<>0 then raise exception 'difficulty boards mixed';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('wordmaze.test_b'),'role','authenticated')::text,true);
 d:=public.wordmaze_api('bootstrap');if jsonb_array_length(d->'player'->'owned')<>1 then raise exception 'cross-user inventory leak';end if;
 d:=public.wordmaze_api('buy','{"animal":"bear"}');if (d->'player'->>'balance')::integer<>40 then raise exception 'purchase charge';end if;
 d:=public.wordmaze_api('buy','{"animal":"bear"}');if (d->'player'->>'balance')::integer<>40 then raise exception 'duplicate purchase charge';end if;
 begin perform public.wordmaze_api('buy','{"animal":"tiger"}');raise exception 'overdraft allowed';exception when others then if sqlerrm='overdraft allowed' then raise;end if;end;
 begin perform public.wordmaze_api('equip','{"animal":"lion"}');raise exception 'unowned equip allowed';exception when others then if sqlerrm='unowned equip allowed' then raise;end if;end;
 begin perform public.wordmaze_judge(auth.uid(),jsonb_build_object('id',other_id,'progress',0,'word','apple','score',99,'spoken',true));raise exception 'cross-user run allowed';exception when others then if sqlerrm='cross-user run allowed' then raise;end if;end;
 perform set_config('request.jwt.claims','{}',true);
 begin perform public.wordmaze_api('bootstrap');raise exception 'missing uid allowed';exception when others then if sqlerrm='missing uid allowed' then raise;end if;end;
end $$;
rollback;
select 'PASS: difficulty marks and boards, Azure judge privileges and thresholds, 12 characters, abilities, rewards, improved personal records, duplicate requests, purchases and user isolation; test data rolled back' as result;
