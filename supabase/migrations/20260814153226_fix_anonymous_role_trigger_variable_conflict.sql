create or replace function private.aggregate_anonymous_perceived_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role_category text;
  v_source_bucket text;
begin
  select
    private.classify_anonymous_perceived_role(new.full_report_json #>> '{document,perceivedRole}'),
    private.classify_anonymous_acquisition_source(analyses.attribution)
  into v_role_category, v_source_bucket
  from public.analyses
  where analyses.id = new.analysis_id;

  if not found then return new; end if;

  insert into public.anonymous_role_aggregates (role_category, source_bucket, analysis_count)
  values (v_role_category, v_source_bucket, 1)
  on conflict (role_category, source_bucket)
  do update set analysis_count = public.anonymous_role_aggregates.analysis_count + 1;

  return new;
end;
$$;

grant usage on schema private to service_role;
grant execute on function private.classify_anonymous_perceived_role(text) to service_role;
grant execute on function private.classify_anonymous_acquisition_source(jsonb) to service_role;
grant execute on function private.aggregate_anonymous_perceived_role() to service_role;
