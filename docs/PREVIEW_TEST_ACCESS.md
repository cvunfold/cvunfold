# Preview report test access

This is a report-scoped test grant, not a coupon or a fake purchase. It permits reviewing actual AI output without Stripe Checkout. Analysis generation still calls the configured AI provider and incurs its normal costs and quotas.

## Enablement

On a verified CVUnfold Vercel project, set these server-only variables exclusively for Preview:

- `REPORT_TEST_ACCESS_ENABLED=true`
- `REPORT_TEST_ACCESS_CODE`: a cryptographically random secret of 32-256 characters, preferably 32 random bytes encoded as base64url.

Do not use a `NEXT_PUBLIC_` variable, a URL parameter or a checked-in code. Do not commit the secret or pass it in shell command arguments or logs. Local development can use the same mechanism with explicit configuration.

The guard requires `VERCEL_ENV=preview` for deployments. Production, unknown deployed environments, non-Vercel production, missing flags and short secrets fail closed. `VERCEL_TARGET_ENV=production` also blocks the feature. The UI receives only an enabled boolean.

Before changing deployment configuration, freshly verify and record service, account, organization/team, project and environment in `EXTERNAL_RESOURCES.md`. Nothing was activated on a hosted deployment by this implementation.

## Manual flow

Create an analysis, open its private report, enter the secret in the preview-only test-access form, and open the report for testing. The UI labels the full report as test access and states that no payment was made.

## Automation flow

1. Create the analysis using the normal upload, verification and quota path.
2. Exchange the analysis access token at `POST /api/report-session`, retaining its HttpOnly session cookie.
3. Send `POST /api/report/test-access` with that cookie and the `x-report-test-code` header. A JSON `{ "code": "..." }` body is also supported.
4. Retain the returned HttpOnly grant cookie and request `GET /api/report`.
5. Require `paid=false`, `fullAccess=true` and `accessMode=preview_test`, then inspect the full report.

Automation must load the code from an approved secret store or environment without printing it. Use only synthetic CVs for routine AI evaluation. Vercel deployment protection remains a separate access requirement.

## Boundaries

The signed cookie is valid for at most 30 minutes and never beyond report expiry. It is bound to the existing report session. It grants no access to other reports and cannot bypass deletion, expiry, analysis quotas or model costs. Changing the secret or disabling the feature revokes existing grants.

The grant never updates `paid_at`, creates a Stripe session, creates a payment row or emits a purchase conversion. Server and client full-report-view events are suppressed for test grants. Analysis creation and the initial teaser retain their existing measurement behavior, so preview data must remain environment-scoped.

Five attempts per report per minute are allowed by the local limiter. Security primarily relies on the high-entropy secret and report session; this in-memory throttle is not a distributed abuse control.

Tests cover production blocking, wrong code, missing session, cross-origin requests, report binding, tampering, expiry, rotation, revocation, automation headers and full-report retrieval without payment. Browser tests exercise PL/EN entry and refresh on desktop and mobile. Local browser tests use synthetic reports, not live AI outputs.
