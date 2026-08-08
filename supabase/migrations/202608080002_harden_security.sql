create index if not exists payments_analysis_id_idx on payments(analysis_id);
create index if not exists feedback_analysis_id_idx on feedback(analysis_id);

alter table webhook_events enable row level security;

-- No client policies: application access remains server-side only.
