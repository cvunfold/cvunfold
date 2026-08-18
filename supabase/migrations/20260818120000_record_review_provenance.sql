-- Record which prompt, model and server pipeline produced each analysis, so two
-- reports can be compared only when their provenance actually matches.
--
-- Deliberately NOT backfilled. Rows created before this migration keep a null
-- review_provenance and must be read as legacy/unknown; relabelling them with
-- today's versions would invent provenance those reports never had.
alter table public.analyses
  add column if not exists review_provenance jsonb;

comment on column public.analyses.review_provenance is
  'Prompt version/variant, rubric version, report pipeline version, resolved and requested model, fallback flag and model config. Null for analyses created before provenance was recorded (legacy/unknown). Server-side only: never returned to the browser.';
