# GPT-6 Luna evaluation, 2026-10-09

## Decision

Do not migrate Production yet. GPT-6 Luna was cheaper in this evaluation, but did not establish better rubric calibration or score invariance. The owner's requested condition, cheaper and better, is not met by this small sample. Branch-scoped Preview was switched back to GPT-5.6 Luna for the control; the immutable GPT-6 Preview remains available for inspecting outputs. Production model/environment values were not written.

## Method

17 new live analyses, all synthetic, Preview-only and unpaid:

- 9 GPT-6 reports: three repetitions each for a guided first-job CV before/after an independent-work clarification, plus strong first-job PL/EN and junior-after-internship cases.
- 8 matched control reports: two repetitions of each guided CV on each model after removing only a fixture-only fictional-data annotation. The project facts and the clarification were preserved.

The first phase showed that GPT-6 sometimes penalizes the fixture annotation. For example, the strong English case explicitly flagged it while the Polish case did not. The raw PL/EN score difference in that phase is therefore confounded and is not treated as proof of a language regression.

Both models used the existing Responses structured-output integration, the same CVUnfold project API configuration, prompt versions matched per locale/stage, technical-v1.3.0 rubric, and report-pipeline-v5. No prompt or score-normalization changes were made to favor either model. The matched control deployments both used SHA aa6aef61b59709deefe1e78963e95aeeed866d70. All 17 persisted provenance records confirmed the intended model, no fallback, Preview environment, unpaid status and no calibration-audit violations. Full reports and bearer tokens remain in local private QA files and are not committed.

## Matched results without the fixture annotation

| Measure | GPT-5.6 Luna | GPT-6 Luna |
| --- | --- | --- |
| Original CV, two runs | 42, 46 | 34, 30 |
| Improved CV, two runs | 62, 62 | 58, 58 |
| Original collaboration category | 18, 20 | 12, 10 |
| Improved collaboration category | 35, 25 | 25, 35 |
| Average estimated generation cost | USD 0.007194 | USD 0.0039515 |
| Average server duration | 38.1 seconds | 41.6 seconds |

GPT-6 cost was approximately 45.1% lower for the identical balanced pair. These are token-based application estimates, not provider invoice reconciliation; infrastructure and failed/retried provider attempts are excluded.

Both models recognize the independent-work clarification. GPT-6's own-contribution scores changed from 32/25 to 77/69. However, cooperation evidence did not change, and its mean collaboration score still rose from 11 to 30. GPT-5.6 also has this issue, rising from 19 to 30. Neither model fixes it merely by switching model IDs.

For the annotated inputs, GPT-6 produced original scores 33, 42, 35 and improved scores 45, 61, 59. These are recorded as exploratory results, with the annotation confound described above. Strong PL/EN scores were 84/75 and the junior-after-internship score was 78.

## Limits and follow-up

This is a small migration smoke evaluation, not a general intelligence benchmark. Score levels differ between models; a lower score is not itself evidence of better or worse analysis. Generation, schema, evidence handling and access checks succeeded, and no commercial experience was invented in the inspected cases. Rubric calibration remains the unresolved gate: define and test score behavior for categories with no new evidence, then repeat the matched evaluation before changing Production.

Validation of the pricing change: 457 unit tests, TypeScript and lint passed. Vercel built the experiment and control deployments successfully. Preview-only quota caps were bounded at 30/hour and 50/day; Production quotas were not changed.
