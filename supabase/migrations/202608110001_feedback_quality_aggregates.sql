-- Retain only non-identifying, cumulative product-quality statistics after a
-- report and its raw feedback are deleted. This table intentionally contains
-- no analysis id, free-text comment, role, timestamp of an individual response,
-- CV content or report content.
create table if not exists public.feedback_quality_aggregates (
  locale text not null check (locale in ('pl', 'en')),
  prompt_version text not null,
  rubric_version text not null,
  review_model text not null,
  rating smallint not null check (rating between 1 and 5),
  accurate text not null check (accurate in ('yes', 'partly', 'no')),
  response_count bigint not null default 0 check (response_count > 0),
  primary key (locale, prompt_version, rubric_version, review_model, rating, accurate)
);

alter table public.feedback_quality_aggregates enable row level security;
revoke all on table public.feedback_quality_aggregates from anon, authenticated;
grant select, insert, update, delete on table public.feedback_quality_aggregates to service_role;

comment on table public.feedback_quality_aggregates is
  'Cumulative feedback counts without analysis identifiers, comments or document/report content.';

-- Preserve already collected ratings without retaining any new link to an
-- analysis. Raw feedback continues to follow the report retention lifecycle.
insert into public.feedback_quality_aggregates (
  locale, prompt_version, rubric_version, review_model, rating, accurate, response_count
)
select
  analyses.locale,
  analyses.prompt_version,
  analyses.rubric_version,
  coalesce(analyses.review_model, 'unknown'),
  feedback.rating,
  feedback.accurate,
  count(*)
from public.feedback
join public.analyses on analyses.id = feedback.analysis_id
group by
  analyses.locale,
  analyses.prompt_version,
  analyses.rubric_version,
  coalesce(analyses.review_model, 'unknown'),
  feedback.rating,
  feedback.accurate
on conflict (locale, prompt_version, rubric_version, review_model, rating, accurate)
do update set response_count = public.feedback_quality_aggregates.response_count + excluded.response_count;

create or replace function private.aggregate_feedback_quality()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.feedback_quality_aggregates (
    locale, prompt_version, rubric_version, review_model, rating, accurate, response_count
  )
  select
    analyses.locale,
    analyses.prompt_version,
    analyses.rubric_version,
    coalesce(analyses.review_model, 'unknown'),
    new.rating,
    new.accurate,
    1
  from public.analyses
  where analyses.id = new.analysis_id
  on conflict (locale, prompt_version, rubric_version, review_model, rating, accurate)
  do update set response_count = public.feedback_quality_aggregates.response_count + 1;

  return new;
end;
$$;

revoke all on function private.aggregate_feedback_quality() from public, anon, authenticated;

drop trigger if exists feedback_quality_aggregate_after_insert on public.feedback;
create trigger feedback_quality_aggregate_after_insert
after insert on public.feedback
for each row execute function private.aggregate_feedback_quality();
