-- Spider Cards — initial schema
-- Run with: supabase db reset

create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  region text default 'oregon',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are publicly readable by handle"
  on public.profiles for select
  using (true);

create policy "profiles are self-writable"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles are self-insertable"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Species master table
-- ---------------------------------------------------------------------------
create table if not exists public.species (
  id uuid primary key default uuid_generate_v4(),
  common_name text not null,
  scientific_name text not null unique,
  raw_traits jsonb not null default '{}'::jsonb,
  -- Computed power components 0-100
  venom_score real,
  size_score real,
  ability_uniqueness real,
  speed_score real,
  aggression_score real,
  -- Raw weighted power score 0-100 (uncalibrated)
  raw_power_score real,
  -- Bell-curve calibrated final score 1-100 (median user-base species ≈ 50)
  calibrated_score real,
  tier text check (tier in ('common','uncommon','rare','epic','legendary')),
  -- Card content
  ability_name text,
  ability_text text,
  ability2_name text,
  ability2_text text,
  flavor_text text,
  -- Safety
  medically_significant boolean not null default false,
  safety_note text,
  -- Bookkeeping
  last_calibrated_at timestamptz,
  enriched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists species_calibrated_score_idx on public.species (calibrated_score desc);

alter table public.species enable row level security;

create policy "species are publicly readable"
  on public.species for select
  using (true);

-- Only service role writes to species; no client-side policies for write.

-- ---------------------------------------------------------------------------
-- Per-region observation counts (drives the bell curve)
-- ---------------------------------------------------------------------------
create table if not exists public.species_observation_count (
  species_id uuid not null references public.species(id) on delete cascade,
  region text not null,
  count bigint not null default 0,
  primary key (species_id, region)
);

alter table public.species_observation_count enable row level security;

create policy "observation counts are publicly readable"
  on public.species_observation_count for select
  using (true);

-- ---------------------------------------------------------------------------
-- Captures
-- ---------------------------------------------------------------------------
create table if not exists public.captures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id uuid references public.species(id) on delete set null,
  photo_path text not null,             -- Supabase Storage object path
  thumbnail_path text,
  lat_coarse real,                       -- ~100m precision, opt-in
  lng_coarse real,
  city text,
  captured_at timestamptz not null default now(),
  condition_modifier real not null default 1.0 check (condition_modifier between 0.97 and 1.03),
  hp int not null check (hp between 1 and 400),
  damage int not null check (damage between 1 and 200),
  tier text not null check (tier in ('common','uncommon','rare','epic','legendary')),
  final_score real not null,
  confidence real not null,
  is_personal_best boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists captures_user_id_idx on public.captures (user_id, captured_at desc);
create index if not exists captures_final_score_idx on public.captures (final_score desc);
create index if not exists captures_species_id_idx on public.captures (species_id);

alter table public.captures enable row level security;

create policy "users see their own captures"
  on public.captures for select
  using (auth.uid() = user_id);

create policy "users insert their own captures"
  on public.captures for insert
  with check (auth.uid() = user_id);

create policy "users delete their own captures"
  on public.captures for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Public leaderboard view — top capture per (user, species) globally
-- Shows city-level location only; never user-precision coords.
-- ---------------------------------------------------------------------------
create or replace view public.leaderboard_global as
select
  c.id,
  c.user_id,
  p.handle,
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

-- ---------------------------------------------------------------------------
-- Trigger: maintain personal-best flag and observation count
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_capture()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bump observation count for user's region (default oregon if missing).
  insert into public.species_observation_count (species_id, region, count)
  values (
    new.species_id,
    coalesce((select region from public.profiles where id = new.user_id), 'oregon'),
    1
  )
  on conflict (species_id, region)
  do update set count = species_observation_count.count + 1;

  -- Mark personal best per (user, species).
  update public.captures
     set is_personal_best = false
   where user_id = new.user_id
     and species_id = new.species_id
     and id <> new.id;

  update public.captures
     set is_personal_best = true
   where id = (
     select id from public.captures
      where user_id = new.user_id and species_id = new.species_id
      order by final_score desc, captured_at desc
      limit 1
   );

  return new;
end;
$$;

drop trigger if exists on_capture_inserted on public.captures;
create trigger on_capture_inserted
  after insert on public.captures
  for each row execute function public.handle_new_capture();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, coalesce(new.raw_user_meta_data->>'handle', 'spider_' || substr(new.id::text, 1, 8)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage bucket for spider photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('spider-photos', 'spider-photos', false)
on conflict (id) do nothing;

create policy "users upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'spider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users read their own photos"
  on storage.objects for select
  using (
    bucket_id = 'spider-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "public can read leaderboard thumbs"
  on storage.objects for select
  using (
    bucket_id = 'spider-photos'
    and (storage.foldername(name))[2] = 'public'
  );
