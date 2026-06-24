-- Nagrik Database Schema
-- Run this in your Supabase SQL editor

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  avatar_url text,
  impact_score int not null default 0,
  reports_created int not null default 0,
  issues_verified int not null default 0,
  people_helped int not null default 0,
  title text not null default 'Neighbour Helper',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ISSUES
-- ============================================================
create table public.issues (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  severity text not null default 'medium',
  status text not null default 'reported',
  priority_score int not null default 50,
  confidence int not null default 50,
  affected_citizens int not null default 1,
  verification_count int not null default 0,
  latitude double precision not null,
  longitude double precision not null,
  address text not null default '',
  image_url text,
  root_cause text,
  root_cause_confidence int,
  similar_cases int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.issues enable row level security;

create policy "Issues are viewable by everyone"
  on public.issues for select using (true);

create policy "Authenticated users can create issues"
  on public.issues for insert with check (auth.role() = 'authenticated');

create policy "Users can update own issues"
  on public.issues for update using (auth.uid() = user_id);

-- ============================================================
-- TIMELINE EVENTS
-- ============================================================
create table public.timeline_events (
  id uuid not null default uuid_generate_v4() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.timeline_events enable row level security;

create policy "Timeline events are viewable by everyone"
  on public.timeline_events for select using (true);

create policy "Authenticated users can create timeline events"
  on public.timeline_events for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- VERIFICATIONS
-- ============================================================
create table public.verifications (
  id uuid not null default uuid_generate_v4() primary key,
  issue_id uuid references public.issues(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null check (action in ('still_exists', 'resolved')),
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

alter table public.verifications enable row level security;

create policy "Verifications are viewable by everyone"
  on public.verifications for select using (true);

create policy "Authenticated users can verify"
  on public.verifications for insert with check (auth.role() = 'authenticated');

create policy "Users can update own verification"
  on public.verifications for update using (auth.uid() = user_id);

-- ============================================================
-- FLASH ALERTS
-- ============================================================
create table public.flash_alerts (
  id uuid not null default uuid_generate_v4() primary key,
  title text not null,
  description text not null default '',
  severity text not null default 'warning',
  affected_population int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.flash_alerts enable row level security;

create policy "Alerts are viewable by everyone"
  on public.flash_alerts for select using (true);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_issues_location on public.issues (latitude, longitude);
create index idx_issues_status on public.issues (status);
create index idx_issues_category on public.issues (category);
create index idx_issues_created_at on public.issues (created_at desc);
create index idx_verifications_issue on public.verifications (issue_id);
create index idx_timeline_issue on public.timeline_events (issue_id);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.issues;
alter publication supabase_realtime add table public.verifications;
alter publication supabase_realtime add table public.flash_alerts;
