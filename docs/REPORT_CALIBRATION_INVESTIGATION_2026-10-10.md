# Report calibration investigation, 2026-10-10

## Contract under test

- Prompt version: v1.6-rc4.1+career-v2.0.0:first_job
- Rubric version: technical-v1.3.0
- Schema version: existing cv_report, report-pipeline-v5
- Primary model: GPT-6 Luna on immutable CVUnfold Preview dpl_4uUR2CkXukSQqS4Uhf9qfbmtRjJd; original GPT-5.6 records inspected offline
- Fallback model: disabled
- Languages: PL for the controlled causal probes; existing PL/EN reports and prompts inspected
- Maximum live-eval cost: estimated USD 0.50 including a conservative retry reserve; stop on a factual hallucination. Provider billing was not independently reconciled.

## Preflight and scope

Service Vercel, account pawelmaczkaczarnecki/6I778X3suBF4Vk1QIWkFhnDt, team team_EvE1UIid0T9jxS7TG10FPaAh, project cvunfold/prj_BJGjEQH6KHy1AhbSSkJVCdjgxd4A, environment immutable Preview b1vxvqwzx at aa6aef61b59709deefe1e78963e95aeeed866d70. Live deployment ownership and Git cvunfold/cvunfold metadata were verified. Existing CVUnfold API configuration is reused under the prior owner-approved testing scope. Supabase is the private CVUnfold organization knjrcparhtiwcskiisjh, project cvunfold-prod/yttktyctjbciyqjpvunv; new synthetic rows are Preview and unpaid. No production, payment, provider-key or prompt changes are part of the investigation.

## Predeclared probes

Each probe changes only the Projects section of the same synthetic, first-job CV. First phase: two runs per probe, at most eight new analyses on GPT-6 Luna.

- Exposure: exactly the same words/facts, independent extension moved before guided work. Checks presentation versus scope.
- Scope: additional independent filtering, cart totals and component/state decisions, no collaboration or verification facts. Checks whether narrow-scope criticism is responsive.
- Verification: only concrete manual cart scenarios, keeping the same independent scope and no collaboration. Checks whether the next-action ranking follows an addressed gap.
- Feedback positive control: actual code review, implemented feedback and joint checking, keeping the original small independent scope. Checks that collaboration rises for its own evidence.

Existing before/after runs serve as baseline. Category scores, references, rationales, issue type/category/order and teaser selection are compared. Cosmetic movement should not establish new independent work; real scope and verification changes should affect their relevant findings. Cooperation must not be inferred from independent programming. No hard score expectation is assigned to the positive control; the evidence and rationale are the primary checks.

After the first phase, four confirmatory analyses are added on the matched GPT-5.6 Luna control: broader contribution and verification only, each twice. This tests whether the ranking response generalizes to the other model. No input, prompt, rubric or outcome criterion is changed. The estimated cost ceiling remains USD 0.50 including retry reserve.

## Observed results

All 12 new analyses completed on the intended model: eight GPT-6 Luna and four GPT-5.6 Luna. Stored metadata confirmed the same prompt/rubric/pipeline, no fallback, Preview and unpaid status. Application estimates sum to USD 0.06256; a threefold reserve is approximately USD 0.19, below the declared USD 0.50 estimate ceiling. Provider invoices and failed-attempt billing were not independently reconciled.

| Controlled change | GPT-6 Luna overall, two runs | GPT-5.6 Luna overall, two runs | Findings |
| --- | --- | --- | --- |
| Baseline: small own extension, from preceding paired test | 58, 58 | 62, 62 | Primary findings alternated between narrow contribution and weak exposure. |
| Same words, own extension moved first | 59, 64 | Not rerun | No ownership-category issue in either run. One report still identified limited practice under credibility; another led with verification. No new contribution fact was introduced. |
| Larger own scope, no cooperation or verification facts | 74, 69 | 70, 69 | No ownership-category issue in all four runs. Both GPT-6 reports led with missing verification; GPT-5.6 led once with exposure, once with missing evidence of operation. |
| Concrete manual verification, same small own scope | 66, 67 | 66, 64 | The verification was recognized. One GPT-5.6 report still led with predominantly guided work, while its quality finding concerned practices beyond the supplied manual checks. This is a different remaining limitation, not a denial that checks occurred. |
| Actual peer review, applied feedback and joint checks | 72, 72 | Not rerun | Cooperation 78/78, with valid references in both runs. |

## Finding 1: missing-evidence scoring is under-specified

Existing paired reports on BOTH models explicitly stated that no collaboration evidence was present and had empty collaboration references. GPT-6 assigned 10/12 before the small contribution change and 25/35 after it; GPT-5.6 assigned 18/20 and 35/25 in the corresponding clean pair.

The new broader-contribution probe, which adds no cooperation facts, produced GPT-6 collaboration 42 and 40. Both rationales still explicitly said the CV contained no cooperation or feedback information, and references remained empty. GPT-5.6 produced 38/35 for the same probe, also with no references. The positive control produced 78/78 and real references, showing that GPT-6 can distinguish actual feedback from absence of it.

Verified code/prompt mechanisms:

- The shared Polish base maps no useful evidence to 0-39, but does not anchor a specific no-evidence value. The 40-59 band also uses weak-proof language, making categorical boundaries less precise than an explicit evidence status.
- A general instruction already says to score each category only from its own evidence. That instruction did not ensure numerical invariance in the live cases.
- `applyServerRubric` replaces labels and weights, preserving model category scores. A replay on all 12 reports confirmed that collaboration scores were preserved.
- `validateEvidence` filters references but does not lower/reclassify a score when references are absent. It computes only the weighted overall value deterministically.
- `auditCalibration` checks important/critical issue caps of 79/65, not the no-evidence band or cross-version invariance. It therefore does not catch the 40/42 no-evidence examples. It flagged one separate important-clarity score of 81 in this experiment.
- The first-job collaboration weight is 0.17. A 20-point unjustified category change moves overall by approximately 3.4 points.

Conclusion: this is not a weight/summation bug and not an invented textual claim that the person collaborated. It is a mismatch between absent evidence and the chosen numeric score. A global-impression effect is a plausible explanation of the model behavior, not a directly observable internal mechanism. The shared contract gives both models too much discretion, and the validation layer does not enforce missing-evidence semantics.

## Finding 2: unclear contribution and narrow contribution are different

The original repair established two independently added cart behaviors. It resolved ambiguous attribution, but did not establish broad independent work. Repeating a narrower-scope observation is therefore not automatically a model error. The broader-contribution probe removed ownership-category criticism on both models in all four runs, confirming that the criticism responds to facts.

The exposure probe returned different leading observations while preserving exactly the same words/facts. With only two repetitions, this does not isolate placement from ordinary run-to-run model variability. Scores and wording should not be read as evidence that new independence was created. Presentation can legitimately change clarity, but the boundary between insufficient exposure and insufficient documented scope is not represented as a structured diagnostic type in the schema. A limited-practice observation can also move from ownership to credibility while describing a related underlying limitation.

The previous statement that a returning contribution observation was necessarily a defect of both models was too broad. The correct assessment is case-dependent: ambiguity was resolved; small scope may remain; ordering and classification are not consistently anchored.

## Finding 3: the application does not independently rank full-report actions

Full report issue numbers are simply the model array order. The schema has severity/category/confidence/action but no explicit next-action value, diagnostic kind or stage-specific priority contract.

The free-feature selection is different: it requires a valid quote, then orders candidates by severity, confidence and original model index. Its weighting does not consider expected benefit or whether a suggestion is a document edit versus a request for broader evidence. Replaying selection on all 12 reports produced four null featured issues because eligible quoted issues were absent. That is an additional free-preview concern, not the cause of the quoted full-report item 01.

A new analysis receives only the current CV evidence, role, stage, rubric and optional job description. It does not receive an old report or old CV, so it cannot know that the visitor followed a previous recommendation. Correct evaluation of the current facts must still work without history; adding history is not needed to fix the observed scoring contract.

The stage-specific module is appended to a large shared prompt after removing only section 2. Generic references to latest roles, repeated evidence and seniority/ownership importance remain in other sections. This is a plausible contributor to priority ambiguity for first-job CVs, not a cause established by a prompt-ablation test in this investigation.

## Proposed repair boundaries

1. Add explicit category evidence states with relevant references in the same model call. Give missing evidence one documented scoring treatment per stage and validate it server-side. The exact anchor or an unscored state is a product decision; arbitrary clamping at 39 would still permit the observed 10-to-35 drift.
2. Distinguish unattributed work, attributed but limited scope, weak exposure and missing verification. For first-job reports, visible small independent work should be acknowledged; a broader-scope limitation should not automatically outrank a more useful document improvement.
3. Make issue priority explainable by the selected stage and the usefulness of the next action. Do not hardcode that testing always outranks contribution, or suppress a valid limited-scope finding.
4. Keep the above controlled variants as regression scenarios: cosmetic placement adds no facts; non-cooperation improvements must not earn cooperation evidence; broader work addresses scope; stated checks cannot be treated as absent; true feedback must supply references and improve the relevant category.

No prompt, schema, scoring implementation, model default, payment setting or Production deployment was changed. The investigation is based on a small PL-only controlled sample plus prior model comparisons. It establishes observed failures and code mechanisms, not general model intelligence or population-wide error rates.

## Source pointers

- `src/lib/ai/prompts/review-pl-v1_6-rc4.ts`, score bands and procedure, lines 674-704.
- `src/lib/ai/validate-report.ts`, `applyServerRubric`, lines 12-29; `auditCalibration`, lines 93-116; evidence filtering and score preservation, lines 120-124; teaser selection, lines 257-277.
- `src/components/report-view.tsx`, full issue array rendering, line 589.
- `src/lib/ai/prompts/index.ts`, base/stage composition, lines 51-55.
- `src/lib/ai/openai-review.ts`, current-input-only payload, lines 83-98.
- `src/lib/rubrics/technical-v1.ts`, first-job/junior weights, line 27.
