# Funnel report queries

Substitute the window into `:since` / `:until` as `timestamptz`. Warsaw is the
reporting timezone; the database stores UTC.

## 1. Top of funnel — Vercel Web Analytics

MCP `get_web_analytics`, `mode: "aggregate"`, `by: ["requestPath"]`, plus `since` and
`until` as dates. Returns `visitors` and `pageviews` per path.

Data begins **2026-08-24**. Nothing before that exists; say so rather than inferring.

`/raport` visits count teaser *and* paid report views together — the path is collapsed
before it reaches Vercel so the access token never leaves the browser. Use Supabase to
separate the two.

## 2. Middle of funnel — uploads through teaser

```sql
select to_char(occurred_at at time zone 'Europe/Warsaw', 'MM-DD HH24') as h,
       count(*) filter (where event_name = 'analysis_started')   as uploads,
       count(*) filter (where event_name = 'analysis_succeeded') as ok,
       count(*) filter (where event_name = 'analysis_failed')    as fail,
       count(*) filter (where event_name = 'teaser_viewed')      as teaser
from public.funnel_events
where occurred_at >= :since and occurred_at < :until
  and runtime_environment = 'production'
group by 1 order by 1;
```

## 3. Checkout and purchase — no environment filter

These two events carry `legacy_unknown`. Filtering them by environment returns zero
and hides all revenue.

```sql
select count(*) filter (where event_name = 'checkout_started') as checkout_started,
       count(*) filter (where event_name = 'purchase')         as purchase_events
from public.funnel_events
where occurred_at >= :since and occurred_at < :until;
```

## 4. Real revenue

Payment rows first, then confirm each buyer in Stripe.

```sql
select p.id, p.stripe_checkout_session_id, p.amount_gross, p.currency, p.paid_at
from public.payments p
where p.livemode = true and p.status = 'paid'
  and p.paid_at >= :since and p.paid_at < :until
order by p.paid_at;
```

For every row, read the Stripe session (`GetCheckoutSessionsSession`, livemode) and
check `customer_details.email`. **Exclude the account owner's own address** — the one
on the Stripe and Vercel accounts. Two of the first three live payments were the
owner testing, which turned 87 zł of apparent revenue into 29 zł of real revenue.

## 5. Audience — who actually arrived

```sql
select role_category, source_bucket, analysis_count
from public.anonymous_role_aggregates
order by source_bucket, analysis_count desc;
```

Cumulative and timestamp-free by design. Difference it against the baseline saved in
project memory to get the arrivals for a period. The number that matters is the non-IT
share of `google_cpc`; `other_non_it` is the catch-all, so a large count there means
"not IT and not otherwise classified", not "a specific other industry".

## 6. Where the submitted role came from

```sql
select coalesce(safe_properties->>'role_source', '(brak)')       as role_source,
       coalesce(safe_properties->>'detected_role_enum', '—')     as detected,
       coalesce(safe_properties->>'broad_role_enum', '—')        as submitted,
       coalesce(safe_properties->>'medium', '(direct)')          as medium,
       count(*) as n
from public.funnel_events
where event_name = 'analysis_started' and runtime_environment = 'production'
  and occurred_at >= :since and occurred_at < :until
group by 1, 2, 3, 4 order by 5 desc;
```

`not_detected` + `frontend_developer` is an untouched default. `user_chose` + `other`
is a visitor stating they are not one of the supported IT roles — the strongest signal
available about audience fit.

## 7. Failures

```sql
select to_char(occurred_at at time zone 'Europe/Warsaw', 'MM-DD HH24:MI') as warsaw,
       safe_properties->>'error_category' as err,
       coalesce(safe_properties->>'not_a_cv_reason',
                safe_properties->>'unreadable_reason', '—') as reason
from public.funnel_events
where event_name = 'analysis_failed' and runtime_environment = 'production'
  and occurred_at >= :since and occurred_at < :until
order by 1;
```

Several failures within seconds carrying the same reason are usually one person
retrying, not several visitors. Check whether they carry `paid_click` before calling
them the owner's testing — real visitors retry too.

## 8. Traffic mix

```sql
select coalesce(safe_properties->>'medium', '(direct)') as medium,
       coalesce(safe_properties->>'term', '—')          as term,
       count(*) filter (where safe_properties->>'paid_click' = 'true') as paid,
       count(*) as total
from public.funnel_events
where event_name = 'analysis_started' and runtime_environment = 'production'
  and occurred_at >= :since and occurred_at < :until
group by 1, 2 order by 4 desc;
```

## Break-even arithmetic

Net per sale is the price less the Stripe fee; model cost is negligible (~0.03 zł).
Required click-to-purchase is `CPC / net`. Convert to the teaser-to-purchase rate the
funnel would need by dividing by the measured click-to-teaser rate. State that number
next to a realistic freemium rate (1–5%) so the gap is visible rather than implied.
