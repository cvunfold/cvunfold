-- A written product-quality comment is useful after the report is deleted, but
-- it must not carry a link back to the person, CV or report that produced it.
-- Keep this small, detached inbox for 90 days only.
create table if not exists public.feedback_notes (
  id uuid primary key default gen_random_uuid(),
  locale text not null check (locale in ('pl', 'en')),
  prompt_version text not null,
  rubric_version text not null,
  review_model text not null,
  rating smallint not null check (rating between 1 and 5),
  accurate text not null check (accurate in ('yes', 'partly', 'no')),
  comment text not null check (length(comment) between 1 and 1000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index if not exists feedback_notes_expires_at_idx on public.feedback_notes(expires_at);

alter table public.feedback_notes enable row level security;
revoke all on table public.feedback_notes from anon, authenticated;
grant select, insert, update, delete on table public.feedback_notes to service_role;

comment on table public.feedback_notes is
  '90-day product feedback comments with no analysis id, issue id, CV content or report content.';

create or replace function private.archive_feedback_note()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if length(trim(coalesce(new.comment, ''))) = 0 then
    return new;
  end if;

  insert into public.feedback_notes (
    locale, prompt_version, rubric_version, review_model, rating, accurate, comment
  )
  select
    analyses.locale,
    analyses.prompt_version,
    analyses.rubric_version,
    coalesce(analyses.review_model, 'unknown'),
    new.rating,
    new.accurate,
    trim(new.comment)
  from public.analyses as analyses
  where analyses.id = new.analysis_id;

  return new;
end;
$$;

revoke all on function private.archive_feedback_note() from public, anon, authenticated;

drop trigger if exists feedback_note_archive_after_insert on public.feedback;
create trigger feedback_note_archive_after_insert
after insert on public.feedback
for each row execute function private.archive_feedback_note();

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
  delete from public.feedback_notes where expires_at <= p_now;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_expired_cv_data(timestamptz) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.cleanup_expired_cv_data(timestamptz) to service_role;
