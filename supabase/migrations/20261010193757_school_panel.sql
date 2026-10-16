-- Applied to the verified CVUnfold project through Supabase MCP; version matches remote migration history.
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);
create table public.school_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null unique check (email = lower(email)),
  created_at timestamptz not null default now()
);
create index school_members_school_idx on public.school_members(school_id);
create table public.school_sessions (
  token_hash text primary key check (char_length(token_hash) = 64),
  user_id uuid not null references public.school_members(user_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index school_sessions_user_idx on public.school_sessions(user_id);
create index school_sessions_expiry_idx on public.school_sessions(expires_at);
create table public.school_groups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  target_role text not null default 'frontend_developer',
  target_seniority text not null default 'first_job' check (target_seniority in ('first_job','junior','mid','senior','lead')),
  created_at timestamptz not null default now()
);
create index school_groups_school_idx on public.school_groups(school_id);
alter table public.analyses add column school_group_id uuid references public.school_groups(id) on delete cascade;
alter table public.analyses add column school_student_name text;
alter table public.analyses add constraint school_analysis_identity check (
  (school_group_id is null and school_student_name is null) or
  (school_group_id is not null and school_student_name is not null and char_length(school_student_name) between 1 and 120)
);
create index analyses_school_group_idx on public.analyses(school_group_id) where school_group_id is not null;
-- Browser clients have no table access. Every operation goes through a server endpoint
-- that verifies the opaque session, current membership, school and group ownership.
alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.school_sessions enable row level security;
alter table public.school_groups enable row level security;
revoke all on public.schools, public.school_members, public.school_sessions, public.school_groups from public, anon, authenticated;
grant select, insert, update, delete on public.schools, public.school_members, public.school_sessions, public.school_groups to service_role;
