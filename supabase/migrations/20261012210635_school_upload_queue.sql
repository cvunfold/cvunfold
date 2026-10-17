-- Private durable queue. Source keys are opaque; source data never enters analytics.
create table public.school_upload_sources(object_key text primary key, expires_at timestamptz not null, deleted_at timestamptz,ready_for_delete boolean not null default false);
create table public.school_upload_batches(
 id uuid primary key default gen_random_uuid(),school_id uuid not null references public.schools(id) on delete cascade,
 group_id uuid not null references public.school_groups(id) on delete cascade,created_by uuid not null references public.school_members(user_id) on delete cascade,
 request_id uuid not null,method_version text not null,status text not null default 'uploading' check(status in ('uploading','queued','processing','complete')),
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '24 hours',unique(school_id,request_id));
create table public.school_upload_jobs(
 id uuid primary key,batch_id uuid not null references public.school_upload_batches(id) on delete cascade,position integer not null,
 analysis_id uuid not null unique,file_name text not null,file_size integer not null check(file_size between 1 and 8388608),
 object_key text not null,student_name text not null,name_manual boolean not null default false,
 status text not null default 'uploading' check(status in ('uploading','queued','processing','complete','failed')),
 not_before timestamptz not null default now(),lease_id uuid not null,lease_until timestamptz,started_at timestamptz,error_code text,
 prepared_report jsonb,prepared_meta jsonb,created_at timestamptz not null default now());
create index school_upload_sources_expiry on public.school_upload_sources(expires_at);
create index school_upload_jobs_batch on public.school_upload_jobs(batch_id,position);
create index school_upload_batches_expiry on public.school_upload_batches(expires_at);
create index school_upload_batches_group on public.school_upload_batches(group_id,created_at);
create index school_upload_jobs_status on public.school_upload_jobs(status,created_at);
alter table public.school_upload_sources enable row level security;alter table public.school_upload_batches enable row level security;alter table public.school_upload_jobs enable row level security;
revoke all on public.school_upload_sources,public.school_upload_batches,public.school_upload_jobs from public,anon,authenticated;
grant all on public.school_upload_sources,public.school_upload_batches,public.school_upload_jobs to service_role;

create function public.create_school_upload_batch(p_school_id uuid,p_group_id uuid,p_user_id uuid,p_request_id uuid,p_method text,p_files jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare b uuid; f jsonb; job uuid; root uuid; lease uuid; key text; n integer:=0; total bigint:=0; used integer;
begin
 perform 1 from public.school_groups where id=p_group_id and school_id=p_school_id for update;
 if not found or not exists(select 1 from public.school_members where user_id=p_user_id and school_id=p_school_id) then raise exception 'REPORT_NOT_FOUND'; end if;
 select id into b from public.school_upload_batches where school_id=p_school_id and request_id=p_request_id;
 if b is not null then
  if not exists(select 1 from public.school_upload_batches where id=b and group_id=p_group_id and created_by=p_user_id) then raise exception 'REPORT_NOT_FOUND'; end if;
  return b;
 end if;
 if jsonb_typeof(p_files)<>'array' or jsonb_array_length(p_files)<1 or jsonb_array_length(p_files)>30 then raise exception 'BATCH_LIMIT'; end if;
 delete from public.school_upload_slots where group_id=p_group_id and state='running' and lease_until<=now();
 select count(*) into used from public.school_upload_slots where group_id=p_group_id;
 if used+jsonb_array_length(p_files)>30 then raise exception 'SCHOOL_SEAT_LIMIT'; end if;
 insert into public.school_upload_batches(school_id,group_id,created_by,request_id,method_version) values(p_school_id,p_group_id,p_user_id,p_request_id,p_method) returning id into b;
 for f in select value from jsonb_array_elements(p_files) loop
  if length(f->>'name') not between 1 and 255 or (f->>'name') !~* '\.(pdf|docx)$' or length(f->>'studentName') not between 1 and 120 then raise exception 'INVALID_FILE'; end if;
  total:=total+(f->>'size')::bigint; if total>104857600 then raise exception 'BATCH_LIMIT'; end if;
  job:=gen_random_uuid(); root:=gen_random_uuid(); lease:=gen_random_uuid();n:=n+1;
  key:=p_school_id::text||'/'||b::text||'/'||job::text||case when (f->>'name')~*'\.pdf$' then '.pdf' else '.docx' end;
  insert into public.school_upload_sources(object_key,expires_at) values(key,now()+interval '24 hours');
  insert into public.school_upload_jobs(id,batch_id,position,analysis_id,file_name,file_size,object_key,student_name,name_manual,lease_id)
  values(job,b,n,root,f->>'name',(f->>'size')::integer,key,f->>'studentName',coalesce((f->>'manual')::boolean,false),lease);
  insert into public.school_upload_slots values(root,p_group_id,lease,now()+interval '24 hours','running');
 end loop;
 return b;
end $$;

create function public.queue_school_upload_batch(p_batch_id uuid,p_school_id uuid,p_uploaded uuid[]) returns boolean
language plpgsql security invoker set search_path='' as $$
declare b public.school_upload_batches;
begin
 select * into b from public.school_upload_batches where id=p_batch_id and school_id=p_school_id for update;
 if b.id is null then raise exception 'REPORT_NOT_FOUND'; end if;
 if b.status<>'uploading' then return true; end if;
 if b.expires_at<=now() then raise exception 'BATCH_EXPIRED'; end if;
 update public.school_upload_jobs set status=case when id=any(p_uploaded) then 'queued' else 'failed' end,error_code=case when id=any(p_uploaded) then null else 'UPLOAD_NOT_FINISHED' end where batch_id=b.id;
 delete from public.school_upload_slots where state='running' and analysis_id in(select analysis_id from public.school_upload_jobs where batch_id=b.id and status='failed');
 update public.school_upload_sources set ready_for_delete=true where object_key in(select object_key from public.school_upload_jobs where batch_id=b.id and status='failed');
 update public.school_upload_batches set status=case when exists(select 1 from public.school_upload_jobs where batch_id=b.id and status='queued') then 'queued' else 'complete' end where id=b.id;
 return true;
end $$;

create function public.claim_school_upload_job(p_school_id uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare g uuid; claimed public.school_upload_jobs;
begin
 -- A crash with a stored result resumes saving, never regenerates the model result.
 update public.school_upload_jobs set status=case when prepared_report is null then 'failed' else 'queued' end,error_code=case when prepared_report is null then 'WORKER_INTERRUPTED' else null end
 where status='processing' and lease_until<=now();
 update public.school_upload_jobs set status='failed',error_code='BATCH_EXPIRED',prepared_report=null,prepared_meta=null where status in ('uploading','queued') and batch_id in(select id from public.school_upload_batches where expires_at<=now());
 delete from public.school_upload_slots where state='running' and analysis_id in(select analysis_id from public.school_upload_jobs where status='failed');
 update public.school_upload_sources set ready_for_delete=true where object_key in(select object_key from public.school_upload_jobs where status='failed');
 update public.school_upload_batches b set status='complete' where status<>'complete' and not exists(select 1 from public.school_upload_jobs j where j.batch_id=b.id and j.status in ('uploading','queued','processing'));
 for g in select b.group_id from public.school_upload_batches b join public.school_upload_jobs j on j.batch_id=b.id
 where j.status='queued' and j.not_before<=now() and b.expires_at>now() and (p_school_id is null or b.school_id=p_school_id) group by b.group_id order by min(b.created_at) limit 20 loop
  perform 1 from public.school_groups where id=g for update skip locked;
  if not found then continue; end if;
  if exists(select 1 from public.school_upload_jobs j join public.school_upload_batches b on b.id=j.batch_id where b.group_id=g and j.status='processing' and j.lease_until>now()) then continue; end if;
  select j1.* into claimed from public.school_upload_jobs j1 join public.school_upload_batches b on b.id=j1.batch_id where b.group_id=g and j1.status='queued' and j1.not_before<=now() order by b.created_at,j1.position limit 1 for update of j1 skip locked;
  if claimed.id is null then continue; end if;
  update public.school_upload_jobs set status='processing',lease_id=gen_random_uuid(),lease_until=now()+interval '8 minutes',started_at=now() where id=claimed.id returning * into claimed;
  update public.school_upload_batches set status='processing' where id=claimed.batch_id;
  return to_jsonb(claimed);
 end loop;
 return null;
end $$;

create function public.fail_school_upload_job(p_job_id uuid,p_lease_id uuid,p_code text) returns void
language plpgsql security invoker set search_path='' as $$
begin
 update public.school_upload_jobs set status='failed',error_code=p_code,prepared_report=null,prepared_meta=null where id=p_job_id and lease_id=p_lease_id and status='processing';
 delete from public.school_upload_slots where state='running' and analysis_id in(select analysis_id from public.school_upload_jobs where id=p_job_id and status='failed');
 update public.school_upload_sources set ready_for_delete=true where object_key in(select object_key from public.school_upload_jobs where id=p_job_id and status='failed');
 update public.school_upload_batches b set status='complete' where id=(select batch_id from public.school_upload_jobs where id=p_job_id) and not exists(select 1 from public.school_upload_jobs where batch_id=b.id and status in ('uploading','queued','processing'));
end $$;

create function public.complete_school_upload_job(p_job_id uuid,p_lease_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare j public.school_upload_jobs; b public.school_upload_batches; m jsonb;
begin
 select * into j from public.school_upload_jobs where id=p_job_id for update;
 if j.status='complete' then return true; end if;
 if j.id is null or j.status<>'processing' or j.lease_id<>p_lease_id or j.lease_until<=now() or j.prepared_report is null then return false; end if;
 select * into b from public.school_upload_batches where id=j.batch_id;
 if b.id is null or b.expires_at<=now() then return false; end if;
 m:=j.prepared_meta;
 update public.school_upload_slots set lease_id=j.lease_id,lease_until=now()+interval '8 minutes' where analysis_id=j.analysis_id and state='running';
 insert into public.analyses(id,status,locale,market,target_role,target_seniority,job_description_present,parse_quality,prompt_version,rubric_version,review_model,input_token_count,output_token_count,estimated_ai_cost,access_token_hash,expires_at,paid_at,completed_at,duration_ms,review_provenance,document_kind,runtime_environment,school_group_id,school_student_name)
 values(j.analysis_id,'complete','pl','pl',j.prepared_report->'document'->>'targetRole',j.prepared_report->'document'->>'targetSeniority',false,'good',j.prepared_report->>'promptVersion',j.prepared_report->>'rubricVersion',m->>'model',(m->>'inputTokens')::integer,(m->>'outputTokens')::integer,(m->>'estimatedCost')::numeric,m->>'tokenHash',(m->>'expiresAt')::timestamptz,null,now(),(m->>'durationMs')::integer,m->'provenance',m->>'documentKind',m->>'environment',b.group_id,j.student_name);
 insert into public.reports(analysis_id,report_version,full_report_json) values(j.analysis_id,j.prepared_report->>'version',j.prepared_report);
 update public.school_upload_slots set state='complete' where analysis_id=j.analysis_id;
 update public.school_upload_jobs set status='complete',prepared_report=null,prepared_meta=null where id=j.id;
 update public.school_upload_sources set ready_for_delete=true where object_key=j.object_key;
 update public.school_upload_batches set status='complete' where id=b.id and not exists(select 1 from public.school_upload_jobs where batch_id=b.id and status in ('uploading','queued','processing'));
 return true;
end $$;

create function public.remove_school_upload_source() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.school_upload_sources set ready_for_delete=true where object_key=old.object_key;
 delete from public.school_upload_slots where analysis_id=old.analysis_id and state='running';
 return old;
end $$;
create trigger delete_school_upload_source before delete on public.school_upload_jobs for each row execute function public.remove_school_upload_source();
revoke all on function public.create_school_upload_batch(uuid,uuid,uuid,uuid,text,jsonb),public.queue_school_upload_batch(uuid,uuid,uuid[]),public.claim_school_upload_job(uuid),public.fail_school_upload_job(uuid,uuid,text),public.complete_school_upload_job(uuid,uuid),public.remove_school_upload_source() from public,anon,authenticated;
grant execute on function public.create_school_upload_batch(uuid,uuid,uuid,uuid,text,jsonb),public.queue_school_upload_batch(uuid,uuid,uuid[]),public.claim_school_upload_job(uuid),public.fail_school_upload_job(uuid,uuid,text),public.complete_school_upload_job(uuid,uuid),public.remove_school_upload_source() to service_role;

-- Operational aggregate only, never names or document content.
create function public.school_upload_timing(p_stage text,p_method text) returns jsonb
language sql security invoker set search_path='' as $$
 select jsonb_build_object('averageMs',coalesce(round(avg(duration_ms)),120000),'sampleCount',count(*)) from (
 select duration_ms from public.analyses where status='complete' and review_model='gpt-6-luna'
 and target_seniority=p_stage and review_provenance->>'pipelineVersion'=p_method
 and duration_ms between 1000 and 600000 and created_at>now()-interval '30 days' order by created_at desc limit 50) samples;
$$;
revoke all on function public.school_upload_timing(text,text) from public,anon,authenticated;
grant execute on function public.school_upload_timing(text,text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('school-upload-queue','school-upload-queue',false,8388608,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/octet-stream','application/zip']) on conflict(id) do nothing;
do $$ begin if exists(select 1 from storage.buckets where id='school-upload-queue' and public=true) then raise exception 'QUEUE_BUCKET_NOT_PRIVATE'; end if; end $$;

create function public.defer_school_upload_job(p_job_id uuid,p_lease_id uuid,p_seconds integer) returns void
language plpgsql security invoker set search_path='' as $$
begin
 update public.school_upload_jobs set status='queued',started_at=null,not_before=now()+make_interval(secs=>greatest(60,least(p_seconds,86400))) where id=p_job_id and lease_id=p_lease_id and status='processing' and prepared_report is null;
end $$;
revoke all on function public.defer_school_upload_job(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.defer_school_upload_job(uuid,uuid,integer) to service_role;

create function public.cancel_school_upload_batch(p_school_id uuid,p_user_id uuid,p_request_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare b uuid;
begin
 select id into b from public.school_upload_batches where school_id=p_school_id and created_by=p_user_id and request_id=p_request_id and status='uploading' for update;
 if b is null then
  return not exists(select 1 from public.school_upload_batches where school_id=p_school_id and created_by=p_user_id and request_id=p_request_id);
 end if;
 update public.school_upload_jobs set status='failed',error_code='UPLOAD_NOT_FINISHED' where batch_id=b;
 delete from public.school_upload_slots where state='running' and analysis_id in(select analysis_id from public.school_upload_jobs where batch_id=b);
 update public.school_upload_sources set ready_for_delete=true where object_key in(select object_key from public.school_upload_jobs where batch_id=b);
 update public.school_upload_batches set status='complete' where id=b;
 return true;
end $$;
revoke all on function public.cancel_school_upload_batch(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.cancel_school_upload_batch(uuid,uuid,uuid) to service_role;
