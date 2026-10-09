alter table public.analyses
  add column if not exists review_provenance jsonb;

comment on column public.analyses.review_provenance is
  'Prompt version/variant, rubric version, report pipeline version, resolved and requested model, fallback flag and model config. Null for analyses created before provenance was recorded (legacy/unknown). Server-side only: never returned to the browser.';
