# CVUnfold prompt composition

The active path is `getReviewPrompt`. It composes:

1. `shared.ts`: evidence/safety and candidate-fact boundaries.
2. `roles.ts`: one of nine role policies.
3. `stages.ts`: one of six stage policies (first-job context resolves junior/auto to first_job).
4. `rubric.ts`: thirty explicit evidence questions and closed document-scope definitions.
5. `languages.ts`: output-language/style only, no different scoring criteria.

The assessment prompt is identical across requested report languages for the same role/stage/context. It receives original CV text without translation. It returns quoted profile scope, thirty independent boolean evidence signals and assessed concerns. `evidence-assessment.ts` validates quotations, maps scope to perceived seniority and assigns 20 + 16 points per satisfied signal in each category, subject to material-concern caps. Since technical-v2.2.0, five satisfied signals give 100; anchors are 20, 36, 52, 68, 84 and 100. Important/critical concerns cap categories at 87/71. Strong/provisional document reception begins at 84/43; strong reception additionally requires source scope that meets the selected stage and no critical concern. A maximum means all document-evidence criteria are satisfied for that role/stage, not verified competence or guaranteed employment. The report writer receives the locked result and cannot add/remove issues, change levels, severities, refs, weights or core CV scores. The optional job-match number remains outside this frozen core contract. It may translate narrative role names without changing the interpreted profile.

Legacy reports retain their stored scores and versions. Calibration audits and school bands choose boundaries from the report's rubric version; incompatible versions never share a school average. A pure rescore of a saved assessment tests the scale transformation, while fresh model assessments test classification stability. Keep these results separate.

Archived baselines are in `archive/`, with an explicit `getArchivedReviewPrompt` accessor for historical comparisons. They are excluded from active request composition. Deprecated CV_REVIEW_PROMPT_VARIANT values do not restore old semantics. Persisted legacy promptVariant strings remain accepted as metadata; old reports remain readable. The new rubric version protects revision comparisons across changed criteria.

To change behavior, update the relevant small module/version and add source-grounded fixtures and regressions first. Test all 216 role/stage/context/output-language compositions. Run bounded live paired/repeated cases on the intended model, preserve failures, and distinguish source classification variability from deterministic server scoring. Do not silently raise tolerance thresholds, drop concerns to keep a high score, or substitute a cached replay for a claimed fresh full-pipeline test.

School feedback must compare the same criteria version and target context. The private assessment fingerprint identifies source/policy/model/provider-schema/settings independently of output language; it is not a global student-data cache or proof of exact model determinism. Never send source text or this private metadata to analytics.
