-- 0003 — Avatars, handle editing, and leaderboard with attribution
-- Run in Supabase SQL Editor.

-- ── Profile fields ────────────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- ── Public avatars bucket ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "anyone can read avatars" on storage.objects;
create policy "anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users update their own avatar" on storage.objects;
create policy "users update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Leaderboard view: include avatar_path ─────────────────────────────────
drop view if exists public.leaderboard_global;

create view public.leaderboard_global as
select
  c.id,
  c.user_id,
  p.handle,
  p.avatar_path,
  c.species_id,
  s.common_name,
  s.scientific_name,
  s.tier,
  c.final_score,
  c.hp,
  c.damage,
  c.city,
  c.captured_at
from public.captures c
join public.profiles p on p.id = c.user_id
join public.species s on s.id = c.species_id
where c.is_personal_best = true
order by c.final_score desc
limit 500;

grant select on public.leaderboard_global to anon, authenticated;
