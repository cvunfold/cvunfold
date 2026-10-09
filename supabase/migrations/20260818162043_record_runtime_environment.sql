-- Preview uses the same Supabase project as production, so funnel rows need an
-- explicit runtime label. Existing rows remain legacy_unknown: inferring their
-- origin from payment mode, timestamps or URLs would make historical reporting
-- look more certain than it is.
alter table public.analyses
  add column if not exists runtime_environment text not null default 'legacy_unknown';

alter table public.analyses
  drop constraint if exists analyses_runtime_environment_check;

alter table public.analyses
  add constraint analyses_runtime_environment_check check (runtime_environment in (
    'production', 'preview', 'development', 'legacy_unknown'
  ));

alter table public.funnel_events
  add column if not exists runtime_environment text not null default 'legacy_unknown';

alter table public.funnel_events
  drop constraint if exists funnel_events_runtime_environment_check;

alter table public.funnel_events
  add constraint funnel_events_runtime_environment_check check (runtime_environment in (
    'production', 'preview', 'development', 'legacy_unknown'
  ));

create index if not exists funnel_events_runtime_environment_time_idx
  on public.funnel_events(runtime_environment, occurred_at desc);

comment on column public.analyses.runtime_environment is
  'Deployment runtime that created the analysis. Existing rows are legacy_unknown.';

comment on column public.funnel_events.runtime_environment is
  'Deployment runtime that created the event. Existing rows are legacy_unknown.';

-- Purchase rows are inserted inside this function, not through the application
-- event writer. Copy the environment already recorded on the analysis so the
-- whole funnel remains in one consistent scope.
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
  analysis_attribution jsonb := '{}'::jsonb;
  analysis_runtime_environment text := 'legacy_unknown';
  measurement_context jsonb := '{}'::jsonb;
begin
  if exists (select 1 from public.webhook_events where stripe_event_id = p_event_id) then return false; end if;
  select * into pending from public.payments where stripe_checkout_session_id = p_checkout_session_id for update;
  if not found or pending.analysis_id <> p_analysis_id or pending.plan <> p_plan
    or pending.amount_gross <> p_amount_gross or lower(pending.currency) <> lower(p_currency) then
    raise exception 'PAYMENT_MISMATCH';
  end if;

  select coalesce(attribution, '{}'::jsonb), runtime_environment
    into analysis_attribution, analysis_runtime_environment
  from public.analyses where id = p_analysis_id;
  if analysis_attribution->>'landing_variant' = 'developer' then
    measurement_context := measurement_context || jsonb_build_object('landing_variant', 'developer');
  end if;
  if analysis_attribution->>'broad_role_enum' in (
    'frontend_developer', 'backend_developer', 'fullstack_developer',
    'mobile_developer', 'qa_test_automation', 'devops_platform'
  ) then
    measurement_context := measurement_context || jsonb_build_object('broad_role_enum', analysis_attribution->>'broad_role_enum');
  end if;
  if analysis_attribution->>'selected_seniority_enum' in ('auto', 'junior', 'mid', 'senior', 'lead') then
    measurement_context := measurement_context || jsonb_build_object('selected_seniority_enum', analysis_attribution->>'selected_seniority_enum');
  end if;
  if analysis_attribution->>'handoff_origin' in ('google_cpc', 'other') then
    measurement_context := measurement_context || jsonb_build_object('handoff_origin', analysis_attribution->>'handoff_origin');
  end if;

  insert into public.webhook_events(stripe_event_id) values (p_event_id);
  update public.payments set stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id), status = 'paid', paid_at = coalesce(paid_at, now()) where id = pending.id;
  update public.analyses set paid_at = coalesce(paid_at, now()), updated_at = now() where id = p_analysis_id and status = 'complete';
  insert into public.funnel_events(analysis_id, payment_id, event_name, locale, market, runtime_environment, safe_properties, dedupe_key)
    values (p_analysis_id, pending.id, 'purchase', pending.locale, pending.market, analysis_runtime_environment,
      jsonb_build_object('plan', p_plan, 'currency', upper(p_currency), 'value', p_amount_gross::numeric / 100) || measurement_context,
      'stripe-purchase:' || p_checkout_session_id)
    on conflict (dedupe_key) where dedupe_group_key is not null do nothing;
  return true;
end;
$$;

revoke all on function public.fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) to service_role;
