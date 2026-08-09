alter table public.analyses
  add column if not exists market text not null default 'pl' check (market in ('pl', 'en')),
  add column if not exists attribution jsonb not null default '{}'::jsonb,
  add column if not exists completed_at timestamptz,
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms >= 0);

alter table public.payments
  add column if not exists locale text not null default 'pl' check (locale in ('pl', 'en')),
  add column if not exists market text not null default 'pl' check (market in ('pl', 'en')),
  add column if not exists analytics_purchase_reported_at timestamptz;

create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete cascade,
  event_name text not null check (event_name in (
    'analysis_started', 'analysis_succeeded', 'analysis_failed', 'teaser_viewed',
    'checkout_started', 'purchase', 'full_report_viewed', 'feedback_submitted', 'delete_requested'
  )),
  locale text not null check (locale in ('pl', 'en')),
  market text not null check (market in ('pl', 'en')),
  safe_properties jsonb not null default '{}'::jsonb,
  dedupe_key text,
  occurred_at timestamptz not null default now(),
  constraint funnel_events_safe_properties_object check (jsonb_typeof(safe_properties) = 'object')
);

create unique index if not exists funnel_events_dedupe_key_idx
  on public.funnel_events(dedupe_key) where dedupe_key is not null;
create index if not exists funnel_events_analysis_id_idx on public.funnel_events(analysis_id);
create index if not exists funnel_events_event_time_idx on public.funnel_events(event_name, occurred_at desc);
create index if not exists analyses_market_created_idx on public.analyses(market, created_at desc);

alter table public.funnel_events enable row level security;
revoke all on table public.funnel_events from anon, authenticated;
grant select, insert, update, delete on table public.funnel_events to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.cleanup_expired_cv_data(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.analyses where expires_at <= p_now;
  get diagnostics deleted_count = row_count;
  delete from public.analysis_rate_limits where expires_at <= p_now;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_expired_cv_data(timestamptz) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.cleanup_expired_cv_data(timestamptz) to service_role;

create or replace function public.fulfill_stripe_payment(
  p_event_id text,
  p_analysis_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_plan text,
  p_amount_gross integer,
  p_currency text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pending public.payments%rowtype;
begin
  if exists (select 1 from public.webhook_events where stripe_event_id = p_event_id) then return false; end if;
  select * into pending from public.payments where stripe_checkout_session_id = p_checkout_session_id for update;
  if not found or pending.analysis_id <> p_analysis_id or pending.plan <> p_plan
    or pending.amount_gross <> p_amount_gross or lower(pending.currency) <> lower(p_currency) then
    raise exception 'PAYMENT_MISMATCH';
  end if;
  insert into public.webhook_events(stripe_event_id) values (p_event_id);
  update public.payments set stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id), status = 'paid', paid_at = coalesce(paid_at, now()) where id = pending.id;
  update public.analyses set paid_at = coalesce(paid_at, now()), updated_at = now() where id = p_analysis_id and status = 'complete';
  insert into public.funnel_events(analysis_id, payment_id, event_name, locale, market, safe_properties, dedupe_key)
    values (p_analysis_id, pending.id, 'purchase', pending.locale, pending.market,
      jsonb_build_object('plan', p_plan, 'currency', upper(p_currency), 'value', p_amount_gross::numeric / 100),
      'stripe-purchase:' || p_checkout_session_id)
    on conflict (dedupe_key) where dedupe_key is not null do nothing;
  return true;
end;
$$;

revoke all on function public.fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) to service_role;

create or replace function public.mark_stripe_payment_terminal(
  p_event_id text,
  p_checkout_session_id text,
  p_status payment_status
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  payment_updated boolean := false;
begin
  if p_status not in ('failed', 'refunded') then raise exception 'INVALID_TERMINAL_STATUS'; end if;
  if exists (select 1 from public.webhook_events where stripe_event_id = p_event_id) then return false; end if;
  insert into public.webhook_events(stripe_event_id) values (p_event_id);
  update public.payments set status = p_status where stripe_checkout_session_id = p_checkout_session_id;
  payment_updated := found;
  if p_status = 'refunded' then
    update public.analyses set paid_at = null, updated_at = now()
    where id = (select analysis_id from public.payments where stripe_checkout_session_id = p_checkout_session_id)
      and not exists (select 1 from public.payments p where p.analysis_id = analyses.id and p.status = 'paid');
  end if;
  return payment_updated;
end;
$$;

revoke all on function public.mark_stripe_payment_terminal(text, text, payment_status) from public, anon, authenticated;
grant execute on function public.mark_stripe_payment_terminal(text, text, payment_status) to service_role;
