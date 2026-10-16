-- Private versions share the original analysis's expiry and cascade deletion.
create table public.analysis_revisions (
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  version smallint not null check (version between 1 and 2),
  request_id uuid not null,
  lease_id uuid not null,
  lease_until timestamptz not null,
  status text not null check (status in ('running', 'complete')),
  report jsonb,
  provenance jsonb,
  created_at timestamptz not null default now(),
  primary key (analysis_id, version),
  unique (analysis_id, request_id),
  check ((status = 'complete') = (report is not null))
);
alter table public.analysis_revisions enable row level security;
revoke all on public.analysis_revisions from public, anon, authenticated;
grant all on public.analysis_revisions to service_role;

-- Root row lock serializes requests across instances. Clients cannot call this.
create function public.reserve_report_revision(p_token_hash text, p_request_id uuid, p_lease_id uuid, p_test boolean default false)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.analyses; r public.analysis_revisions; slot smallint;
begin
  select * into a from public.analyses where access_token_hash = p_token_hash and status = 'complete' and expires_at > now() for update;
  if a.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
  if a.paid_at is null and not p_test then raise exception 'PAYMENT_REQUIRED'; end if;
  if a.job_description_present then raise exception 'LEGACY_REPORT'; end if;
  select * into r from public.analysis_revisions where analysis_id = a.id and request_id = p_request_id;
  if r.status = 'complete' then return jsonb_build_object('version', r.version, 'status', 'complete'); end if;
  if exists(select 1 from public.analysis_revisions where analysis_id = a.id and status = 'running' and lease_until > now()) then raise exception 'REVISION_BUSY'; end if;
  delete from public.analysis_revisions where analysis_id = a.id and status = 'running' and lease_until <= now();
  select s into slot from generate_series(1,2) s where not exists(select 1 from public.analysis_revisions where analysis_id = a.id and version = s) order by s limit 1;
  if slot is null then raise exception 'REVISION_LIMIT'; end if;
  insert into public.analysis_revisions(analysis_id, version, request_id, lease_id, lease_until, status)
    values(a.id, slot, p_request_id, p_lease_id, now() + interval '8 minutes', 'running');
  return jsonb_build_object('version', slot, 'status', 'running');
end $$;

create function public.complete_report_revision(p_token_hash text, p_lease_id uuid, p_report jsonb, p_provenance jsonb, p_test boolean default false)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare a public.analyses; saved integer;
begin
  select * into a from public.analyses where access_token_hash = p_token_hash and status = 'complete' and expires_at > now() for update;
  if a.id is null or (a.paid_at is null and not p_test) then return false; end if;
  update public.analysis_revisions set status = 'complete', report = p_report, provenance = p_provenance, created_at = now()
    where analysis_id = a.id and lease_id = p_lease_id and status = 'running' and lease_until > now();
  get diagnostics saved = row_count;
  return saved = 1;
end $$;
revoke all on function public.reserve_report_revision(text,uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.complete_report_revision(text,uuid,jsonb,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.reserve_report_revision(text,uuid,uuid,boolean) to service_role;
grant execute on function public.complete_report_revision(text,uuid,jsonb,jsonb,boolean) to service_role;
