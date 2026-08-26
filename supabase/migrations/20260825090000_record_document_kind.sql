-- Every unreadable_document failure observed in production so far was a scanned
-- PDF with no text layer. Knowing the pdf/docx split among *successful* uploads
-- is what sizes the question of whether OCR would unlock a real share of traffic.
-- The extraction diagnostics already carry this value; it was simply never kept.
-- Existing rows stay null: the source files are deleted after parsing, so the
-- kind cannot be recovered, and guessing it would make history look certain.
alter table public.analyses
  add column if not exists document_kind text;

alter table public.analyses
  drop constraint if exists analyses_document_kind_check;

alter table public.analyses
  add constraint analyses_document_kind_check check (document_kind in ('pdf', 'docx'));

comment on column public.analyses.document_kind is
  'Source document format, from the extraction diagnostics. Null for rows created before 2026-08-25.';
