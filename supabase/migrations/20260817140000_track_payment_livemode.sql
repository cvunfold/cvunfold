-- The diagnostics report summed every "paid" row as revenue, including the founder's own
-- Stripe test-mode transactions (cs_test_...), which inflated a real week's revenue from
-- 87 zl to 145 zl. Track live vs test mode explicitly so revenue reporting can exclude it.
alter table public.payments add column livemode boolean not null default true;

-- One-time backfill for rows written before this column existed. Stripe's cs_live_/cs_test_
-- session ID prefix is a stable, real convention, but it is not part of the documented API
-- contract, so new rows set this column directly from session.livemode instead of relying on it.
update public.payments set livemode = false where stripe_checkout_session_id like 'cs_test_%';
