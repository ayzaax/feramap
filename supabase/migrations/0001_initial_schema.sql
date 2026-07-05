-- FeraMap Database Schema
-- Generated from production Supabase instance

create extension if not exists postgis;

-- ============================================
-- TABLES
-- ============================================

create table public.colonies (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.zones (
  id uuid not null default gen_random_uuid() primary key,
  colony_id uuid not null references public.colonies(id) on delete cascade,
  name text not null,
  boundary geometry(Polygon, 4326),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.profiles (
  id uuid not null primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  role text default 'reporter',
  colony_id uuid references public.colonies(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.cats (
  id uuid not null default gen_random_uuid() primary key,
  colony_id uuid references public.colonies(id) on delete set null,
  zone_id uuid references public.zones(id) on delete set null,
  name text,
  status text not null default 'spotted' check (status in ('spotted', 'trapped', 'neutered', 'returned')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent', 'Overdue')),
  summary text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.sightings (
  id uuid not null default gen_random_uuid() primary key,
  cat_id uuid not null references public.cats(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  location geography(Point, 4326) not null,
  notes text,
  condition text not null check (condition in ('healthy', 'injured', 'sick', 'pregnant', 'unknown')),
  status text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.cat_photos (
  id uuid not null default gen_random_uuid() primary key,
  cat_id uuid not null references public.cats(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  photo_url text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table public.user_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  cat_id uuid not null references public.cats(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (user_id, cat_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.colonies enable row level security;
alter table public.zones enable row level security;
alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.sightings enable row level security;
alter table public.cat_photos enable row level security;
alter table public.user_follows enable row level security;

-- Colonies: public read
create policy "Anyone can view colonies" on public.colonies for select using (true);

-- Zones: public read
create policy "Anyone can view zones" on public.zones for select using (true);

-- Profiles: public read, owner write
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Cats: public read, authenticated insert, RESTRICTED update (owner or coordinator only)
create policy "Anyone can view cats" on public.cats for select using (true);
create policy "Authenticated users can insert cats" on public.cats for insert with check (auth.role() = 'authenticated');
create policy "Assigned volunteer or coordinator can update cats" on public.cats for update
  using (
    assigned_to is null
    or auth.uid() = assigned_to
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'coordinator'
    )
  );

-- Sightings: public read, authenticated insert
create policy "Anyone can view sightings" on public.sightings for select using (true);
create policy "Authenticated users can insert sightings" on public.sightings for insert with check (auth.role() = 'authenticated');

-- Cat photos: public read, authenticated insert
create policy "Anyone can view photos" on public.cat_photos for select using (true);
create policy "Authenticated users can insert photos" on public.cat_photos for insert with check (auth.role() = 'authenticated');

-- User follows: private to the user
create policy "Users can view their own follows" on public.user_follows for select using (auth.uid() = user_id);
create policy "Users can insert their own follows" on public.user_follows for insert with check (auth.uid() = user_id);
create policy "Users can delete their own follows" on public.user_follows for delete using (auth.uid() = user_id);

-- ============================================
-- SPATIAL INDEX
-- ============================================

create index if not exists sightings_location_idx on public.sightings using gist (location);

