alter table public.analyses
  add column if not exists document_kind text;

alter table public.analyses
  drop constraint if exists analyses_document_kind_check;

alter table public.analyses
  add constraint analyses_document_kind_check check (document_kind in ('pdf', 'docx'));

comment on column public.analyses.document_kind is
  'Source document format, from the extraction diagnostics. Null for rows created before 2026-08-25.';
