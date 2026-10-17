-- Owner-managed invoice access for the entire school. No Stripe payment is recorded.
create table public.school_invoice_access (
 school_id uuid primary key references public.schools(id) on delete cascade,
 state text not null check(state in ('active','revoked')),
 invoice_reference text not null check(length(invoice_reference) between 1 and 120),
 expires_at timestamptz not null,
 activated_at timestamptz not null default now(),
 revoked_at timestamptz,
 updated_at timestamptz not null default now()
);
create table public.school_access_changes (
 request_id uuid primary key,
 school_id uuid not null references public.schools(id) on delete cascade,
 action text not null check(action in ('activate','revoke')),
 invoice_reference text,
 expires_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.school_invoice_access enable row level security;
alter table public.school_access_changes enable row level security;
revoke all on public.school_invoice_access,public.school_access_changes from public,anon,authenticated;
grant select,insert,update,delete on public.school_invoice_access,public.school_access_changes to service_role;

create function public.change_school_invoice_access(p_school_id uuid,p_request_id uuid,p_action text,p_invoice_reference text default null,p_expires_at timestamptz default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare old public.school_access_changes;
begin
 perform 1 from public.schools where id=p_school_id for update;
 if not found then raise exception 'SCHOOL_NOT_FOUND'; end if;
 if p_request_id is null or p_action is null or p_action not in ('activate','revoke') then raise exception 'INVALID_ACCESS_CHANGE'; end if;
 select * into old from public.school_access_changes where request_id=p_request_id;
 if old.request_id is not null then
  if old.school_id<>p_school_id or old.action<>p_action or old.invoice_reference is distinct from p_invoice_reference or old.expires_at is distinct from p_expires_at then raise exception 'SCHOOL_ACCESS_REQUEST_REUSED'; end if;
  return jsonb_build_object('replayed',true);
 end if;
 if p_action='activate' then
  if p_invoice_reference is null or length(trim(p_invoice_reference)) not between 1 and 120 or p_expires_at is null or p_expires_at<=now() then raise exception 'INVALID_ACCESS_CHANGE'; end if;
  insert into public.school_invoice_access(school_id,state,invoice_reference,expires_at)
  values(p_school_id,'active',p_invoice_reference,p_expires_at)
  on conflict(school_id) do update set state='active',invoice_reference=excluded.invoice_reference,expires_at=excluded.expires_at,activated_at=now(),revoked_at=null,updated_at=now();
 else
  if p_invoice_reference is not null or p_expires_at is not null then raise exception 'INVALID_ACCESS_CHANGE'; end if;
  if not exists(select 1 from public.school_invoice_access where school_id=p_school_id) then raise exception 'INVOICE_ACCESS_NOT_FOUND'; end if;
  update public.school_invoice_access set state='revoked',revoked_at=now(),updated_at=now() where school_id=p_school_id;
 end if;
 insert into public.school_access_changes(request_id,school_id,action,invoice_reference,expires_at) values(p_request_id,p_school_id,p_action,p_invoice_reference,p_expires_at);
 return jsonb_build_object('replayed',false);
end $$;

create function public.school_group_access(p_group_id uuid) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare school uuid; access public.school_invoice_access; legacy public.school_group_packages;
begin
 select school_id into school from public.school_groups where id=p_group_id;
 if school is null then raise exception 'REPORT_NOT_FOUND'; end if;
 select * into access from public.school_invoice_access where school_id=school;
 if access.school_id is not null then
  return jsonb_build_object('active',access.state='active' and access.expires_at>now(),'source','invoice','state',case when access.state='revoked' then 'revoked' when access.expires_at<=now() then 'expired' else 'active' end,'expiresAt',access.expires_at);
 end if;
 -- Existing verified historical group purchases retain their original expiry.
 -- Once invoice management exists for a school, expiry/revocation cannot fall back to Stripe.
 select * into legacy from public.school_group_packages where group_id=p_group_id and state='paid' and expires_at>now();
 if legacy.group_id is not null then return jsonb_build_object('active',true,'source','legacy','state','active','expiresAt',legacy.expires_at); end if;
 return jsonb_build_object('active',false,'source','none','state','inactive');
end $$;
revoke all on function public.change_school_invoice_access(uuid,uuid,text,text,timestamptz),public.school_group_access(uuid) from public,anon,authenticated;
grant execute on function public.change_school_invoice_access(uuid,uuid,text,text,timestamptz),public.school_group_access(uuid) to service_role;

-- Retire the old school payment functions without deleting billing history.
revoke all on function public.begin_school_checkout(uuid,uuid,uuid,text),public.bind_school_checkout(uuid,text,text),public.fulfill_school_package(uuid,text,text) from public,anon,authenticated,service_role;

create function public.school_report_access(p_group_id uuid,p_individually_paid boolean) returns boolean
language plpgsql stable security invoker set search_path='' as $$
declare access jsonb;
begin
 access:=public.school_group_access(p_group_id);
 return coalesce((access->>'active')::boolean,false) or (access->>'source'<>'invoice' and coalesce(p_individually_paid,false));
end $$;
revoke all on function public.school_report_access(uuid,boolean) from public,anon,authenticated;
grant execute on function public.school_report_access(uuid,boolean) to service_role;

create or replace function public.reserve_school_revision(p_analysis_id uuid,p_school_id uuid,p_request_id uuid,p_lease_id uuid,p_test boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.analyses; r public.analysis_revisions;
begin
 select a1.* into a from public.analyses a1 join public.school_groups g on g.id=a1.school_group_id
 where a1.id=p_analysis_id and g.school_id=p_school_id and a1.status='complete' and a1.expires_at>now() for update of a1;
 if a.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
 if not p_test and not public.school_report_access(a.school_group_id,a.paid_at is not null) then raise exception 'PAYMENT_REQUIRED'; end if;
 select * into r from public.analysis_revisions where analysis_id=a.id and request_id=p_request_id;
 if r.status='complete' then return jsonb_build_object('version',r.version,'status','complete'); end if;
 if exists(select 1 from public.analysis_revisions where analysis_id=a.id and status='running' and lease_until>now()) then raise exception 'REVISION_BUSY'; end if;
 delete from public.analysis_revisions where analysis_id=a.id and status='running' and lease_until<=now();
 if exists(select 1 from public.analysis_revisions where analysis_id=a.id and status='complete') then raise exception 'REVISION_LIMIT'; end if;
 insert into public.analysis_revisions(analysis_id,version,request_id,lease_id,lease_until,status) values(a.id,1,p_request_id,p_lease_id,now()+interval '8 minutes','running');
 return jsonb_build_object('version',1,'status','running');
end $$;
create or replace function public.complete_school_revision(p_analysis_id uuid,p_school_id uuid,p_lease_id uuid,p_report jsonb,p_provenance jsonb,p_test boolean default false)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a public.analyses; saved integer;
begin
 select a1.* into a from public.analyses a1 join public.school_groups g on g.id=a1.school_group_id
 where a1.id=p_analysis_id and g.school_id=p_school_id and a1.status='complete' and a1.expires_at>now() for update of a1;
 if a.id is null then return false; end if;
 if not p_test and not public.school_report_access(a.school_group_id,a.paid_at is not null) then return false; end if;
 update public.analysis_revisions set status='complete',report=p_report,provenance=p_provenance,created_at=now()
 where analysis_id=a.id and lease_id=p_lease_id and status='running' and lease_until>now();
 get diagnostics saved=row_count; return saved=1;
end $$;
