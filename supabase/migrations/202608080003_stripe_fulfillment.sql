create or replace function fulfill_stripe_payment(
  p_event_id text,
  p_analysis_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_plan text,
  p_amount_gross integer,
  p_currency text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pending payments%rowtype;
begin
  if exists (select 1 from webhook_events where stripe_event_id = p_event_id) then
    return false;
  end if;

  select * into pending
  from payments
  where stripe_checkout_session_id = p_checkout_session_id
  for update;

  if not found
    or pending.analysis_id <> p_analysis_id
    or pending.plan <> p_plan
    or pending.amount_gross <> p_amount_gross
    or lower(pending.currency) <> lower(p_currency) then
    raise exception 'PAYMENT_MISMATCH';
  end if;

  insert into webhook_events(stripe_event_id) values (p_event_id);
  update payments set
    stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
    status = 'paid',
    paid_at = coalesce(paid_at, now())
  where id = pending.id;
  update analyses set paid_at = coalesce(paid_at, now()), updated_at = now()
  where id = p_analysis_id and status = 'complete';
  return true;
end;
$$;

revoke all on function fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) from public;
grant execute on function fulfill_stripe_payment(text, uuid, text, text, text, text, integer, text) to service_role;
