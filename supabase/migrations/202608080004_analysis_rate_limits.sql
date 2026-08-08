create table if not exists public.analysis_rate_limits (
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{64}$'),
  window_kind text not null check (window_kind in ('hour', 'day')),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (subject_hash, window_kind, window_start)
);

create index if not exists analysis_rate_limits_expires_at_idx
  on public.analysis_rate_limits (expires_at);

alter table public.analysis_rate_limits enable row level security;
revoke all on public.analysis_rate_limits from anon, authenticated;

create or replace function public.consume_analysis_quota(
  p_subject_hash text,
  p_hour_limit integer,
  p_day_limit integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hour_start timestamptz := date_trunc('hour', v_now);
  v_day_start timestamptz := date_trunc('day', v_now);
  v_hour_count integer := 0;
  v_day_count integer := 0;
begin
  if p_subject_hash !~ '^[a-f0-9]{64}$' or p_hour_limit < 1 or p_day_limit < p_hour_limit then
    raise exception 'INVALID_ANALYSIS_QUOTA_ARGUMENTS';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_subject_hash, 0));

  delete from public.analysis_rate_limits
    where subject_hash = p_subject_hash and expires_at <= v_now;

  select request_count into v_hour_count
    from public.analysis_rate_limits
    where subject_hash = p_subject_hash and window_kind = 'hour' and window_start = v_hour_start;

  select request_count into v_day_count
    from public.analysis_rate_limits
    where subject_hash = p_subject_hash and window_kind = 'day' and window_start = v_day_start;

  v_hour_count := coalesce(v_hour_count, 0);
  v_day_count := coalesce(v_day_count, 0);

  if v_day_count >= p_day_limit then
    return query select false, greatest(1, ceil(extract(epoch from (v_day_start + interval '1 day' - v_now)))::integer);
    return;
  end if;

  if v_hour_count >= p_hour_limit then
    return query select false, greatest(1, ceil(extract(epoch from (v_hour_start + interval '1 hour' - v_now)))::integer);
    return;
  end if;

  insert into public.analysis_rate_limits (subject_hash, window_kind, window_start, request_count, expires_at)
  values (p_subject_hash, 'hour', v_hour_start, 1, v_hour_start + interval '2 hours')
  on conflict (subject_hash, window_kind, window_start)
  do update set request_count = public.analysis_rate_limits.request_count + 1;

  insert into public.analysis_rate_limits (subject_hash, window_kind, window_start, request_count, expires_at)
  values (p_subject_hash, 'day', v_day_start, 1, v_day_start + interval '2 days')
  on conflict (subject_hash, window_kind, window_start)
  do update set request_count = public.analysis_rate_limits.request_count + 1;

  return query select true, 0;
end;
$$;

revoke all on function public.consume_analysis_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_analysis_quota(text, integer, integer) to service_role;
