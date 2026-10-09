# Career-stage Preview QA, 2026-10-09

## Artifact and scope

- Tested application source: `e38cf0ca00c027e7725f9eca88d63e41efbf0213`.
- Verified Preview: `dpl_2rcjCex7v1NCr6o7PMrxxwbruFaG`, target `null` (Preview), project `cvunfold`, owner team `team_EvE1UIid0T9jxS7TG10FPaAh`.
- Model actually used: `gpt-5.6-luna`, no fallback on these four analyses.
- Shared rubric `technical-v1.3.0`; stage prompts `career-v2.0.0:first_job` and `career-v2.0.0:junior`, using the configured PL rc4 / EN v3 bases.
- Four one-page, entirely fictional PDF CVs. No real candidate data, Stripe transactions, prices or campaign settings were used or changed.

## Results

| Synthetic input | Selected stage | Locale | Score | Perceived profile | Issues |
| --- | --- | --- | --- | --- | --- |
| Two concrete projects, tests, accessibility and personal contribution | First job | PL | 86 | Junior | 2 |
| Equivalent facts translated into English | First job | EN | 85 | Junior | 2 |
| Three-month internship, supervised delivery, tests and feedback | Junior | PL | 80 | Junior | 2 |
| Course certificate and a guided project without described independent extensions | First job | PL | 47 | Junior | 3 |

All four returned reports passed the schema, evidence-reference, deterministic-score, safe-action and career-stage tripwires. The strong first-job PL/EN pair differed by one overall point and at most eight points per category. Both read Junior and simulated Interview. This is document-level interpretation, not a prediction of employment.

## Manual review

The first-job and Junior reports focused on personal contribution, project functionality, testing, feedback, inspectability and clearer explanations. No required mentoring, revenue, customer counts or organisation-wide impact were found in the recommendations. No invented commercial role, result, metric or organisational responsibility was found in these four reports. Suggestions asked the applicant to verify facts before adding them.

The strong pair received different issue ordering/category labels in PL versus EN, although the score and principal profile were consistent. In the guided-only report, the generic-project-description observation partly overlaps the observations about contribution and functionality; this is a minor recommendation-quality limitation to monitor, not proof that every quality criterion passes for arbitrary CVs.

The sample is small and covers Frontend applicants at First job and Junior stages. It does not establish equivalent live-model coverage for Mid, Senior, Lead or all other role families.

## Access, persistence and cost

For all four specific test analyses, live database verification found:

- `status=complete`, `runtime_environment=preview` and `paid=false`;
- zero payment rows and zero purchase events;
- the actual selected stage prompt recorded in review provenance;
- no provider fallback.

The complete report was retrieved only after the server validated the signed report-scoped test grant. The unpaid API payload did not expose issues. Runtime error/fatal counts for the tested Preview were empty during the test window.

Stored AI cost estimates total approximately USD 0.025651. These are application telemetry estimates, not provider-dashboard billing confirmation, and do not include build costs.

## Deployment prerequisites

The owner explicitly approved the first-job database migration after its risk was explained. It was applied as `20261009194033`, and live checks confirmed the new stage constraint and unchanged service-role-only execution privileges. Historical migration filenames and statements were reconciled to applied database history instead of replaying old changes.

Preview test-access configuration is limited to `feat/career-stage-analysis`. Production must continue to reject `/api/report/test-access` and expose the form without test-access controls. No API keys, access tokens, test codes, CV contents or full model responses are stored in this document or Git.
