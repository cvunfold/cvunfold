-- Retain only cumulative audience-fit counts. This table intentionally has no
-- analysis/report identifier, raw model output, timestamp, locale, UTM, click
-- identifier, IP address, CV content or report content.
create table if not exists public.anonymous_role_aggregates (
  role_category text not null check (role_category in ('supported_it', 'other_it', 'non_it', 'unclear')),
  source_bucket text not null check (source_bucket in ('google_cpc', 'other')),
  analysis_count bigint not null default 0 check (analysis_count > 0),
  primary key (role_category, source_bucket)
);

alter table public.anonymous_role_aggregates enable row level security;
revoke all on table public.anonymous_role_aggregates from public, anon, authenticated;
grant select, insert, update on table public.anonymous_role_aggregates to service_role;

comment on table public.anonymous_role_aggregates is
  'Cumulative model-perceived role buckets without identifiers, timestamps or document/report content.';

create or replace function private.classify_anonymous_perceived_role(p_role text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  normalized text := regexp_replace(
    translate(lower(trim(coalesce(p_role, ''))), 'ąćęłńóśźż', 'acelnoszz'),
    '[^a-z0-9+#.-]+', ' ', 'g'
  );
begin
  normalized := trim(regexp_replace(normalized, '[[:space:]]+', ' ', 'g'));

  if normalized = ''
    or normalized ~ '^(unknown|unclear|n a|not specified|not clear|nieznan[ay]|niejasn[ay]|nieokreslon[ay]|brak danych|student|freelancer|consultant|manager|specialist|engineer)$'
    or normalized ~ '(cannot|unable to|insufficient).*(determine|infer)'
    or normalized ~ 'nie (mozna|da sie).*(okreslic|ustalic)'
  then return 'unclear';
  end if;

  if normalized ~ '(business|sales) development|business developer' then return 'non_it'; end if;

  if normalized ~ '(front[- ]?end|back[- ]?end|full[- ]?stack|software|web|mobile|android|ios|embedded|game) (developer|engineer|programmer|programist(a|ka))'
    or normalized ~ '(^| )(developer|programmer|programist(a|ka))( |$)'
    or normalized ~ '(^| )(qa|quality assurance|software tester|test automation|automation tester|tester automatyzujacy)( |$)'
    or normalized ~ '(^| )(devops|site reliability engineer|sre|platform engineer)( |$)'
  then return 'supported_it';
  end if;

  if normalized ~ '(data (engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|security engineer|cybersecurity|cloud engineer|infrastructure engineer|network engineer|system administrator|administrator systemow|database administrator|dba|it support|help ?desk|solutions architect|software architect|product manager|product owner|scrum master|business analyst|technical writer|technical project manager|it recruiter|recruiter it)'
    or normalized ~ '(^| )(ux|ui) (designer|researcher)( |$)'
  then return 'other_it';
  end if;

  return 'non_it';
end;
$$;

create or replace function private.classify_anonymous_acquisition_source(p_attribution jsonb)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_attribution->>'handoff_origin' = 'google_cpc'
      or lower(coalesce(p_attribution->>'source', '')) = 'google'
        and lower(coalesce(p_attribution->>'medium', '')) in ('cpc', 'ppc', 'paid_search')
    then 'google_cpc'
    else 'other'
  end;
$$;

revoke all on function private.classify_anonymous_perceived_role(text) from public, anon, authenticated;
revoke all on function private.classify_anonymous_acquisition_source(jsonb) from public, anon, authenticated;

-- Aggregate currently retained reports once. The raw perceived role is used
-- only inside this statement and is never copied to the aggregate table.
insert into public.anonymous_role_aggregates (role_category, source_bucket, analysis_count)
select
  private.classify_anonymous_perceived_role(reports.full_report_json #>> '{document,perceivedRole}'),
  private.classify_anonymous_acquisition_source(analyses.attribution),
  count(*)
from public.reports
join public.analyses on analyses.id = reports.analysis_id
group by 1, 2
on conflict (role_category, source_bucket)
do update set analysis_count = public.anonymous_role_aggregates.analysis_count + excluded.analysis_count;

create or replace function private.aggregate_anonymous_perceived_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  role_category text;
  source_bucket text;
begin
  select
    private.classify_anonymous_perceived_role(new.full_report_json #>> '{document,perceivedRole}'),
    private.classify_anonymous_acquisition_source(analyses.attribution)
  into role_category, source_bucket
  from public.analyses
  where analyses.id = new.analysis_id;

  if not found then return new; end if;

  insert into public.anonymous_role_aggregates (role_category, source_bucket, analysis_count)
  values (role_category, source_bucket, 1)
  on conflict (role_category, source_bucket)
  do update set analysis_count = public.anonymous_role_aggregates.analysis_count + 1;

  return new;
end;
$$;

revoke all on function private.aggregate_anonymous_perceived_role() from public, anon, authenticated;

drop trigger if exists anonymous_role_aggregate_after_insert on public.reports;
create trigger anonymous_role_aggregate_after_insert
after insert on public.reports
for each row execute function private.aggregate_anonymous_perceived_role();
