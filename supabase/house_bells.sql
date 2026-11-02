-- 우리 집(kaylastudio.web.app) 초인종·초대
-- 스도쿠·양치·cloud_ 표는 건드리지 않음 (모두 house_ 접두어)
-- Supabase 대시보드 > SQL Editor에 통째로 붙여 넣고 Run. 여러 번 실행해도 됩니다.

create table if not exists public.house_bells (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references auth.users(id) on delete cascade,
  guest_email text,
  guest_name text,
  status text not null default 'ringing' check (status in ('ringing', 'invited', 'declined')),
  decided_by text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  expires_at timestamptz
);
create index if not exists house_bells_guest_idx on public.house_bells (guest_id, created_at desc);
create index if not exists house_bells_status_idx on public.house_bells (status, created_at desc);
alter table public.house_bells enable row level security;
revoke all on public.house_bells from anon, authenticated;  -- 표는 직접 못 만지고 아래 함수로만

-- 가족 = 아빠·엄마 구글 계정 (딸은 부모 계정 아래 아이 프로필로 들어옴)
create or replace function public.house_is_family() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(lower(auth.jwt() ->> 'email') in ('hyojong.yee@gmail.com', 'yelea.nho@gmail.com'), false);
$$;

-- 손님이 스도쿠 친구인지: 손님 가족과 우리 집(아빠·엄마 계정) 가족 사이에 친구 관계가 있으면 참
create or replace function public.house_is_friend() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    join public.family_members ma on ma.profile_id in (f.profile_a, f.profile_b)
    join public.family_members mb on mb.profile_id in (f.profile_a, f.profile_b) and mb.profile_id <> ma.profile_id
    where ma.family_id in (
        select fm.family_id from public.family_members fm
        join public.profile_access pa on pa.profile_id = fm.profile_id and pa.revoked_at is null
        where pa.auth_user_id = auth.uid())
      and mb.family_id in (
        select fm.family_id from public.family_members fm
        join public.profile_access pa on pa.profile_id = fm.profile_id and pa.revoked_at is null
        join auth.users u on u.id = pa.auth_user_id
        where lower(u.email) in ('hyojong.yee@gmail.com', 'yelea.nho@gmail.com'))
  );
$$;

-- 손님: 초인종 누르기 (10분 안에 다시 누르면 같은 벨, 이미 초대받았으면 그대로 돌려줌)
create or replace function public.house_ring() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare b public.house_bells;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if public.house_is_family() then raise exception 'family_member'; end if;
  if not public.house_is_friend() then raise exception 'not_friend'; end if;
  select * into b from public.house_bells where guest_id = auth.uid() order by created_at desc limit 1;
  if found and ((b.status = 'invited' and b.expires_at > now()) or (b.status = 'ringing' and b.created_at > now() - interval '10 minutes')) then
    return jsonb_build_object('id', b.id, 'status', b.status, 'expires_at', b.expires_at);
  end if;
  insert into public.house_bells (guest_id, guest_email, guest_name)
  values (auth.uid(), auth.jwt() ->> 'email',
          coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', auth.jwt() ->> 'email'))
  returning * into b;
  return jsonb_build_object('id', b.id, 'status', b.status, 'expires_at', b.expires_at);
end $$;

-- 손님: 내 초인종 상태 (초대 유효 시간 포함)
create or replace function public.house_guest_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', b.id, 'status', b.status, 'expires_at', b.expires_at)
  from public.house_bells b where b.guest_id = auth.uid() order by b.created_at desc limit 1;
$$;

-- 가족: 지금 문 앞에서 기다리는 손님 (30분 안에 누른 것)
create or replace function public.house_bells() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.house_is_family() then raise exception 'forbidden'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'guest_name', b.guest_name, 'guest_email', b.guest_email, 'created_at', b.created_at) order by b.created_at)
    from public.house_bells b where b.status = 'ringing' and b.created_at > now() - interval '30 minutes'), '[]'::jsonb);
end $$;

-- 가족: 초대하기(12시간) / 다음에
create or replace function public.house_answer(bell uuid, accept boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare b public.house_bells;
begin
  if not public.house_is_family() then raise exception 'forbidden'; end if;
  update public.house_bells set
    status = case when accept then 'invited' else 'declined' end,
    decided_by = auth.jwt() ->> 'email', decided_at = now(),
    expires_at = case when accept then now() + interval '12 hours' end
  where id = bell and status = 'ringing' returning * into b;
  if not found then raise exception 'not_ringing'; end if;
  return jsonb_build_object('id', b.id, 'status', b.status, 'expires_at', b.expires_at);
end $$;

revoke all on function public.house_is_friend(), public.house_is_family(), public.house_ring(), public.house_guest_status(), public.house_bells(), public.house_answer(uuid, boolean) from public, anon;
grant execute on function public.house_is_friend(), public.house_is_family(), public.house_ring(), public.house_guest_status(), public.house_bells(), public.house_answer(uuid, boolean) to authenticated;
