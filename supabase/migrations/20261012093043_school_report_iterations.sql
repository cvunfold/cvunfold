-- Private school pilot entitlements and leases. Only server service_role may call RPCs.
create table public.school_group_packages (
  group_id uuid primary key references public.school_groups(id) on delete cascade,
  checkout_session_id text unique not null,
  payment_intent_id text,
  state text not null check(state in ('pending','paid','refunded')),
  amount integer not null check(amount = 29900),
  currency text not null check(currency = 'pln'),
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.school_upload_slots (
  analysis_id uuid primary key,
  group_id uuid not null references public.school_groups(id) on delete cascade,
  lease_id uuid not null,
  lease_until timestamptz not null,
  state text not null check(state in ('running','complete'))
);
create index school_upload_slots_group_idx on public.school_upload_slots(group_id);
alter table public.school_group_packages enable row level security;
alter table public.school_upload_slots enable row level security;
revoke all on public.school_group_packages, public.school_upload_slots from public, anon, authenticated;
grant all on public.school_group_packages, public.school_upload_slots to service_role;
-- Existing roots occupy one seat each. Deleted future roots never free completed seats.
insert into public.school_upload_slots
select id,school_group_id,gen_random_uuid(),now(),'complete' from public.analyses where school_group_id is not null;

create function public.reserve_school_upload(p_group_id uuid,p_school_id uuid,p_analysis_id uuid,p_lease_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare g public.school_groups; used integer;
begin
 select * into g from public.school_groups where id=p_group_id and school_id=p_school_id for update;
 if g.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
 -- A saved root survives a interrupted acknowledgement and must retain its seat.
 update public.school_upload_slots s set state='complete'
 where s.group_id=g.id and s.state='running' and exists(select 1 from public.analyses a where a.id=s.analysis_id and a.school_group_id=g.id);
 delete from public.school_upload_slots where group_id=g.id and state='running' and lease_until<=now();
 select count(*) into used from public.school_upload_slots where group_id=g.id;
 if used>=30 then raise exception 'SCHOOL_SEAT_LIMIT'; end if;
 insert into public.school_upload_slots values(p_analysis_id,g.id,p_lease_id,now()+interval '8 minutes','running');
 return true;
end $$;
create function public.finish_school_upload(p_group_id uuid,p_school_id uuid,p_analysis_id uuid,p_lease_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare saved integer;
begin
 perform 1 from public.school_groups where id=p_group_id and school_id=p_school_id for update;
 if not found then return false; end if;
 update public.school_upload_slots s set state='complete' where s.analysis_id=p_analysis_id and s.group_id=p_group_id and s.lease_id=p_lease_id
 and exists(select 1 from public.analyses a where a.id=p_analysis_id and a.school_group_id=p_group_id);
 get diagnostics saved=row_count; return saved=1;
end $$;
create function public.release_school_upload(p_group_id uuid,p_school_id uuid,p_analysis_id uuid,p_lease_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.school_groups where id=p_group_id and school_id=p_school_id for update;
 if not found then return; end if;
 delete from public.school_upload_slots s where s.analysis_id=p_analysis_id and s.group_id=p_group_id and s.lease_id=p_lease_id and s.state='running'
 and not exists(select 1 from public.analyses a where a.id=s.analysis_id);
end $$;

create function public.reserve_school_revision(p_analysis_id uuid,p_school_id uuid,p_request_id uuid,p_lease_id uuid,p_test boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.analyses; r public.analysis_revisions;
begin
 select a1.* into a from public.analyses a1 join public.school_groups g on g.id=a1.school_group_id
 where a1.id=p_analysis_id and g.school_id=p_school_id and a1.status='complete' and a1.expires_at>now() for update of a1;
 if a.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
 if a.paid_at is null and not p_test and not exists(select 1 from public.school_group_packages where group_id=a.school_group_id and state='paid' and expires_at>now()) then raise exception 'PAYMENT_REQUIRED'; end if;
 select * into r from public.analysis_revisions where analysis_id=a.id and request_id=p_request_id;
 if r.status='complete' then return jsonb_build_object('version',r.version,'status','complete'); end if;
 if exists(select 1 from public.analysis_revisions where analysis_id=a.id and status='running' and lease_until>now()) then raise exception 'REVISION_BUSY'; end if;
 delete from public.analysis_revisions where analysis_id=a.id and status='running' and lease_until<=now();
 if exists(select 1 from public.analysis_revisions where analysis_id=a.id and status='complete') then raise exception 'REVISION_LIMIT'; end if;
 insert into public.analysis_revisions(analysis_id,version,request_id,lease_id,lease_until,status) values(a.id,1,p_request_id,p_lease_id,now()+interval '8 minutes','running');
 return jsonb_build_object('version',1,'status','running');
end $$;
create function public.complete_school_revision(p_analysis_id uuid,p_school_id uuid,p_lease_id uuid,p_report jsonb,p_provenance jsonb,p_test boolean default false)
returns boolean language plpgsql security invoker set search_path='' as $$
declare a public.analyses; saved integer;
begin
 select a1.* into a from public.analyses a1 join public.school_groups g on g.id=a1.school_group_id
 where a1.id=p_analysis_id and g.school_id=p_school_id and a1.status='complete' and a1.expires_at>now() for update of a1;
 if a.id is null then return false; end if;
 if a.paid_at is null and not p_test and not exists(select 1 from public.school_group_packages where group_id=a.school_group_id and state='paid' and expires_at>now()) then return false; end if;
 update public.analysis_revisions set status='complete',report=p_report,provenance=p_provenance,created_at=now()
 where analysis_id=a.id and lease_id=p_lease_id and status='running' and lease_until>now();
 get diagnostics saved=row_count; return saved=1;
end $$;
create function public.release_school_revision(p_analysis_id uuid,p_school_id uuid,p_lease_id uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.analyses a join public.school_groups g on g.id=a.school_group_id where a.id=p_analysis_id and g.school_id=p_school_id for update of a;
 if not found then return; end if;
 delete from public.analysis_revisions where analysis_id=p_analysis_id and lease_id=p_lease_id and status='running';
end $$;

create function public.fulfill_school_package(p_group_id uuid,p_session_id text,p_payment_intent text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare p public.school_group_packages;
begin
 select * into p from public.school_group_packages where group_id=p_group_id and checkout_session_id=p_session_id for update;
 if p.group_id is null then raise exception 'SCHOOL_PAYMENT_MISMATCH'; end if;
 if p.state='refunded' then return false; end if;
 if p.state='paid' then return true; end if;
 update public.school_group_packages set state='paid',payment_intent_id=p_payment_intent,paid_at=now(),expires_at=now()+interval '30 days' where group_id=p_group_id;
 return true;
end $$;
-- No public RPC access, including the default PUBLIC execute privilege.
do $$ declare f record; begin
 for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname in ('reserve_school_upload','finish_school_upload','release_school_upload','reserve_school_revision','complete_school_revision','release_school_revision','fulfill_school_package') loop
 execute format('revoke all on function %s from public, anon, authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
-- A late worker may not insert a root after its seat lease has been reclaimed.
create function public.guard_school_analysis_slot() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.school_group_id is null then return new; end if;
 perform 1 from public.school_groups where id=new.school_group_id for update;
 perform 1 from public.school_upload_slots where analysis_id=new.id and group_id=new.school_group_id and state='running' and lease_until>now();
 if not found then raise exception 'ANALYSIS_SLOT_REQUIRED'; end if;
 return new;
end $$;
create trigger guard_school_analysis_slot before insert on public.analyses for each row execute function public.guard_school_analysis_slot();
create function public.release_failed_school_analysis_slot() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 delete from public.school_upload_slots where analysis_id=old.id and state='running';
 return old;
end $$;
create trigger release_failed_school_analysis_slot after delete on public.analyses for each row execute function public.release_failed_school_analysis_slot();
revoke all on function public.guard_school_analysis_slot(),public.release_failed_school_analysis_slot() from public,anon,authenticated;
grant execute on function public.guard_school_analysis_slot(),public.release_failed_school_analysis_slot() to service_role;
create function public.begin_school_checkout(p_group_id uuid,p_school_id uuid,p_attempt_id uuid,p_replace_session text default null)
returns text language plpgsql security invoker set search_path='' as $$
declare p public.school_group_packages;
begin
 perform 1 from public.school_groups where id=p_group_id and school_id=p_school_id for update;
 if not found then raise exception 'REPORT_NOT_FOUND'; end if;
 select * into p from public.school_group_packages where group_id=p_group_id for update;
 if p.state='paid' then raise exception 'PACKAGE_ALREADY_PAID'; end if;
 if p.state='refunded' then raise exception 'PACKAGE_REFUNDED'; end if;
 if p.group_id is not null and (p_replace_session is null or p.checkout_session_id<>p_replace_session) then return p.checkout_session_id; end if;
 insert into public.school_group_packages(group_id,checkout_session_id,state,amount,currency)
 values(p_group_id,'attempt:'||p_attempt_id::text,'pending',29900,'pln')
 on conflict(group_id) do update set checkout_session_id=excluded.checkout_session_id;
 return 'attempt:'||p_attempt_id::text;
end $$;
create function public.bind_school_checkout(p_group_id uuid,p_attempt text,p_session_id text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare changed integer;
begin
 update public.school_group_packages set checkout_session_id=p_session_id where group_id=p_group_id and state='pending' and checkout_session_id=p_attempt;
 get diagnostics changed=row_count;
 return changed=1 or exists(select 1 from public.school_group_packages where group_id=p_group_id and checkout_session_id=p_session_id);
end $$;
revoke all on function public.begin_school_checkout(uuid,uuid,uuid,text),public.bind_school_checkout(uuid,text,text) from public,anon,authenticated;
grant execute on function public.begin_school_checkout(uuid,uuid,uuid,text),public.bind_school_checkout(uuid,text,text) to service_role;
alter table public.feedback add column report_version smallint not null default 0 check(report_version between 0 and 2);
