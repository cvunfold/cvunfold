---
name: cvunfold-funnel-report
description: Assemble one CVUnfold funnel report from Vercel Web Analytics (visits), Supabase funnel_events (uploads to purchase), Stripe (real revenue) and the anonymous role aggregates (who is actually arriving). Use when asked how the funnel, traffic, campaign or revenue is doing, or for a before/after read on a change.
---

# CVUnfold funnel report

Four systems each hold one slice of the funnel and none of them agrees with the others
by default. This skill assembles them into a single report and, more importantly,
avoids the specific ways this data has already misled us.

## Read this first: the traps

Every one of these produced a wrong conclusion that had to be retracted. They are not
hypothetical.

**Revenue counts the owner's own purchases.** `isRealPurchase` filters Stripe *test*
mode, but the owner also bought twice in *live* mode while testing. Three "sales" were
really one. Always confirm the buyer from Stripe `customer_details.email` and exclude
the account owner's own address. Until `diagnostics()` is fixed it overstates revenue
by those purchases.

**`checkout_started` and `purchase` are never `production`.** They carry
`legacy_unknown`, because the purchase row is written by the `fulfill_stripe_payment`
SQL function copying `analyses.runtime_environment`, and every pre-2026-08-18 analysis
defaulted to that value. Filtering those two events by `runtime_environment =
'production'` silently returns zero and hides all revenue. Filter the other events;
do not filter these.

**`analysis_failed` can exceed `analysis_started`.** An empty file is rejected before
the start event fires. More failures than starts is correct, not a bug.

**`broad_role_enum` is the form field, not a detection.** It is written before the CV
is parsed and defaults to `frontend_developer`. Read `role_source` alongside it:
`not_detected` plus `frontend_developer` means the visitor never touched the field.

**The role aggregate table is cumulative and has no timestamps.** A "since when"
question can only be answered by differencing against a saved baseline. The baseline
lives in the assistant's project memory (`ads-baseline-2026-08-21`). Save a fresh one
whenever a change is made that the next report should measure.

**Do not turn a small sample into a verdict.** Zero purchases is the expected outcome
at this volume. Compute how many teaser views the window actually holds and say what
the observation is consistent with, rather than declaring a result. State the number
of observations needed before the question could be settled.

## Gather

Use the connected MCP tools. Identifiers:

- Supabase project `yttktyctjbciyqjpvunv`
- Vercel project `prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A`, team `team_EvE1UIid0T9jxS7TG10FPaAh`
- Stripe account `acct_1U25LlPlwW2w7lmM` (livemode)

Run every query in [references/queries.md](references/queries.md). In order:

1. **Top of funnel** — Vercel Web Analytics, grouped by `requestPath`. This only has
   data from 2026-08-24; for earlier windows say the top is unavailable rather than
   inferring it.
2. **Middle** — Supabase `funnel_events`, production only, uploads through teaser.
3. **Checkout and purchase** — Supabase, *without* the environment filter.
4. **Revenue** — Stripe live sessions, buyer confirmed, owner's own excluded.
5. **Audience** — `anonymous_role_aggregates`, differenced against the saved baseline.
6. **Failures** — `analysis_failed` with `not_a_cv_reason` / `unreadable_reason`.
7. **Ads spend**, when the question involves cost: Google Ads is not connected by MCP.
   Ask for a CSV export or read it in the browser; never estimate spend from clicks.

## Report

Lead with the funnel table, visits through purchase, with the conversion between
consecutive steps. Then, only where there is something to say:

- **What changed** against the previous report or the saved baseline, as deltas.
- **Who arrived** — the non-IT share of `google_cpc`, which is the question the
  campaign hinges on.
- **Where people fell out**, naming the step and the measured rate.
- **Failures** with their reasons, and whether any are the owner's own testing
  (bursts seconds apart, usually with the same failure reason).
- **Money**, if asked: spend against real revenue, and the click-to-purchase rate the
  current price and CPC would need to break even.

Keep every number traceable to one of the queries. When two systems disagree — Vercel
counts visitors, Supabase counts events — say so instead of silently picking one.

## Rules

State plainly when a number cannot be known, and why. "No page-view data before
2026-08-24" is a better answer than a reconstruction.

Never link a purchase, a profession or a report to a person. The aggregates are built
so this is impossible; do not work around them by reading `reports.perceived_role`
against timestamps. If profession granularity is wanted, extend the closed category
list instead — that is the sanctioned route.

Report what the data supports and no more. If the honest summary is that nothing has
changed and the sample is too small, that is the summary.
