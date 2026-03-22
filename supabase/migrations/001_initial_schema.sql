-- Routesmith initial schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Profiles ──
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_location jsonb,               -- {lat, lng, address}
  default_activity text default 'running',
  default_preferences jsonb,         -- cached wizard defaults
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Saved Routes ──
create table saved_routes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  custom_name text,
  geometry jsonb not null,            -- GeoJSON LineString
  distance numeric not null,          -- meters
  duration numeric,                   -- seconds
  elevation_gain numeric,
  elevation_loss numeric,
  score jsonb not null,               -- RouteScore object
  tags jsonb not null default '[]'::jsonb,
  waypoints jsonb not null,           -- [[lng,lat], ...] used to generate
  color text,
  activity_type text not null,
  route_type text not null default 'loop',
  start_address text,
  start_location jsonb,               -- {lat, lng}
  rating integer check (rating between 1 and 5),
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ── Corridors ──
create table corridors (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade, -- null = auto-discovered
  name text not null,
  geometry jsonb not null,            -- GeoJSON LineString
  corridor_type text not null,        -- river_path, bike_path, greenway, park_perimeter, bridge
  length_meters numeric,
  surface text,                       -- paved, gravel, dirt
  tags jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  osm_way_ids jsonb not null default '[]'::jsonb,  -- source OSM IDs for dedup
  created_at timestamptz not null default now()
);

-- ── Route Feedback (RLHF) ──
create table route_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  route_id uuid references saved_routes(id) on delete set null,
  chosen boolean not null,            -- was this the route the user picked?
  rating integer check (rating between 1 and 5),
  feedback_text text,
  preferences_snapshot jsonb,         -- what prefs generated this
  created_at timestamptz not null default now()
);

-- ── Indexes ──
create index idx_saved_routes_user on saved_routes(user_id, saved_at desc);
create index idx_saved_routes_activity on saved_routes(activity_type);
create index idx_corridors_user on corridors(user_id);
create index idx_corridors_type on corridors(corridor_type);
create index idx_route_feedback_user on route_feedback(user_id);
create index idx_route_feedback_route on route_feedback(route_id);

-- ── Updated_at trigger ──
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ── Row Level Security ──
-- User-owned data: only the owner can read/write
alter table profiles enable row level security;
alter table saved_routes enable row level security;
alter table corridors enable row level security;
alter table route_feedback enable row level security;

create policy "Users can manage their own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage their own routes" on saved_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own corridors" on corridors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-discovered corridors (user_id IS NULL) are readable by all authenticated users
create policy "Anyone can read auto-discovered corridors" on corridors
  for select using (user_id is null and auth.uid() is not null);

create policy "Users can manage their own feedback" on route_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
