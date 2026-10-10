# Report policy and GPT-6 Luna release, 2026-10-10

## Behavior

New reviews classify category evidence as none, indirect or concrete. The server assigns exactly 20/100 to none or to categories with no valid evidence reference, with a localized explanation that this is missing information in the CV, not missing personal skill. Model weights and labels still come from the server rubric.

New structured output includes diagnostic kinds, same-project verification references and links from actions/reservations to issue IDs. First-job reports demote a limited but concretely attributed contribution to a secondary minor observation. Unknown contribution is not softened simply because the model labels it limited. Missing cooperation cannot be classified as missing project verification. Existing checks are acknowledged; incomplete checking scope is distinct from an absence of checking. Linked steps and reservations follow the final issue order.

The free first-job preview can show an explicit evidence gap without manufacturing a CV quote. Historical full reports are not re-scored. The provider schema requires new fields while the stored-report schema accepts legacy objects.

First-job weak anchors prevent a clean layout, technology list and guided-only project from receiving strong evidence scores. Named real tasks, decisions, checks and feedback retain credit, including course projects and internships.

## Validation

- 474 unit tests, TypeScript and lint passed; Vercel built the release source successfully.
- 16 PL/EN desktop/mobile browser tests passed for career selection, report access and free/paid boundaries.
- 48 real synthetic Preview analyses completed: 20 implementation probes, 20 refined-contract probes and 8 final-calibration probes. All stored provenance confirmed GPT-6 Luna, no fallback, Preview and unpaid status.
- Application-estimated cost: USD 0.161052. A threefold retry reserve is USD 0.483156, below the declared USD 0.50 estimate ceiling. This is not provider invoice reconciliation.
- Final calibration: guided-only CV PL/EN 31/34; small independent extension 55/51; concrete manual checks 61/62; strong first-job CV 88/85.
- The refined 20-case suite also covered broader contribution, exposure-only movement, peer feedback and the junior-after-internship profile in both languages. No evidence drift or broken action links passed the runner.

The release versions are career-v2.1.2, technical-v1.4.0, report-pipeline-v6.3 and evidence-priority-v1.3. The final pipeline increment only keeps the explanatory text consistent when acknowledging checks already performed; it does not change numeric scoring or model input.

## Access and rollout

The owner explicitly authorized this release. Production OPENAI_REVIEW_MODEL is set to gpt-6-luna after Preview validation, and Git main is the deployment source. Existing fallback and credentials are preserved. The temporary Preview daily cap was restored to 50. Production quota configuration and payment rules are unchanged. Production test access remains blocked.

A protected admin configuration endpoint verifies the actual deployed model, pipeline, policy and anchor without exposing API credentials or resetting quotas. Production deployment/runtime verification is recorded after the merge.

## Limits

This is a small synthetic PL/EN regression set, not a general intelligence benchmark. Supported category scores still vary between independent generations. Fixed missing-evidence scoring does not by itself guarantee that a model classifies every possible CV correctly; evidence references, localized prompt rules and regression checks remain necessary.
