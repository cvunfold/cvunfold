create extension if not exists pgcrypto;

create type analysis_status as enum ('uploaded','parsing','analyzing','complete','failed','deleted');
create type payment_status as enum ('pending','paid','failed','refunded');

create table analyses (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  status analysis_status not null default 'uploaded', locale text not null check (locale in ('pl','en')), target_role text not null,
  target_seniority text not null check (target_seniority in ('junior','mid','senior','lead','auto')), job_description_present boolean not null default false,
  temporary_file_key text, raw_file_deleted_at timestamptz, parse_quality text check (parse_quality in ('good','degraded')),
  error_code text, prompt_version text not null, rubric_version text not null, extraction_model text, review_model text,
  input_token_count integer, output_token_count integer, estimated_ai_cost numeric(12,6), access_token_hash text unique not null,
  expires_at timestamptz not null, paid_at timestamptz
);
create table reports (id uuid primary key default gen_random_uuid(), analysis_id uuid unique not null references analyses(id) on delete cascade,
  report_version text not null, full_report_json jsonb not null, created_at timestamptz not null default now());
create table payments (id uuid primary key default gen_random_uuid(), analysis_id uuid not null references analyses(id) on delete cascade,
  stripe_checkout_session_id text unique, stripe_payment_intent_id text unique, stripe_customer_id text, plan text not null check(plan in ('full_review','job_match')),
  amount_gross integer not null, currency text not null default 'pln', status payment_status not null default 'pending', created_at timestamptz not null default now(), paid_at timestamptz);
create table feedback (id uuid primary key default gen_random_uuid(), analysis_id uuid not null references analyses(id) on delete cascade,
  issue_id text, rating smallint not null check(rating between 1 and 5), accurate text not null check(accurate in ('yes','partly','no')),
  comment text check(length(comment) <= 1000), created_at timestamptz not null default now());
create table webhook_events (stripe_event_id text primary key, processed_at timestamptz not null default now());
create index analyses_expires_at_idx on analyses(expires_at) where status <> 'deleted';
alter table analyses enable row level security; alter table reports enable row level security; alter table payments enable row level security; alter table feedback enable row level security;
-- No client policies: all access is server-side through the service role after token validation.
