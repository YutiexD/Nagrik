-- Activity + anonymous demo persistence migration for an existing Nagrik Supabase project.
-- Run this once in the Supabase SQL editor before sharing the deployed app.

alter table public.issues
  add column if not exists reporter_session_id text;

alter table public.verifications
  alter column user_id drop not null;

alter table public.verifications
  add column if not exists session_id text;

alter table public.verifications
  drop constraint if exists verifications_issue_id_session_id_key;

alter table public.verifications
  add constraint verifications_issue_id_session_id_key unique (issue_id, session_id);

create table if not exists public.user_activities (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  issue_id uuid references public.issues(id) on delete cascade,
  issue_title text not null default '',
  action text not null check (action in ('reported', 'verified', 'marked resolved')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or session_id is not null)
);

alter table public.user_activities enable row level security;

drop policy if exists "Demo visitors can create issues" on public.issues;
create policy "Demo visitors can create issues"
  on public.issues for insert with check (auth.role() = 'anon' and user_id is null and reporter_session_id is not null);

drop policy if exists "Demo visitors can update verification fields" on public.issues;
create policy "Demo visitors can update verification fields"
  on public.issues for update using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

drop policy if exists "Demo visitors can create timeline events" on public.timeline_events;
create policy "Demo visitors can create timeline events"
  on public.timeline_events for insert with check (auth.role() = 'anon');

drop policy if exists "Authenticated users can verify" on public.verifications;
create policy "Authenticated users can verify"
  on public.verifications for insert with check (
    (auth.role() = 'authenticated' and auth.uid() = user_id)
    or
    (auth.role() = 'anon' and user_id is null and session_id is not null)
  );

drop policy if exists "Users can update own verification" on public.verifications;
create policy "Users can update own verification"
  on public.verifications for update using (
    auth.uid() = user_id or (auth.role() = 'anon' and user_id is null and session_id is not null)
  );

drop policy if exists "Activities are viewable by everyone" on public.user_activities;
create policy "Activities are viewable by everyone"
  on public.user_activities for select using (true);

drop policy if exists "Authenticated users can create activities" on public.user_activities;
create policy "Authenticated users can create activities"
  on public.user_activities for insert with check (
    (auth.role() = 'authenticated' and auth.uid() = user_id)
    or
    (auth.role() = 'anon' and user_id is null and session_id is not null)
  );

create index if not exists idx_issues_reporter_session on public.issues (reporter_session_id);
create index if not exists idx_verifications_session on public.verifications (session_id);
create index if not exists idx_user_activities_user on public.user_activities (user_id, created_at desc);
create index if not exists idx_user_activities_session on public.user_activities (session_id, created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.user_activities;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
