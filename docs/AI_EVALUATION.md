# AI evaluation

Run `pnpm eval`. The synthetic fixtures cover responsibilities-only senior CVs, result-driven Mid, Junior without commercial work, keyword stuffing, ownership hidden by structure, prompt injection, unreadable scans, strong impact, years/evidence conflict, poor ordering, the per-specialisation backend/full-stack/mobile/QA/DevOps pairs, the experimental general-role cases, and the Natalie canary.

Release gates: Zod validity, exact rubric weight sum, valid evidence refs, no unsupported issue retained, no score calculated by the model, injection text treated as inert data, teaser leakage test, and manual calibration by experienced Frontend Developers.

## Prompt versioning

The live prompt is chosen in exactly one place: `src/lib/ai/prompts/index.ts`. Nothing else may pick a prompt, because every recorded `promptVersion` originates there.

| Variant | Locale | Version string | File |
| --- | --- | --- | --- |
| `stable` (default) | pl | `review-pl-v3.3.0` | `prompts/review-pl-v3.ts` |
| `stable` (default) | en | `review-en-v1.3.0` | `prompts/review-en-v1.ts` |
| `v1.6-rc1` | pl | `v1.6-rc1` | `prompts/review-pl-v1_6-rc1.ts` |
| `v1.6-rc1` | en | `review-en-v1.3.0` (unchanged) | `prompts/review-en-v1.ts` |
| `v1.6-rc2` | pl | `v1.6-rc2` | `prompts/review-pl-v1_6-rc2.ts` |
| `v1.6-rc2` | en | `review-en-v1.3.0` (unchanged) | `prompts/review-en-v1.ts` |
| `v1.6-rc3` | pl | `v1.6-rc3` | `prompts/review-pl-v1_6-rc3.ts` |
| `v1.6-rc3` | en | `review-en-v2.0.0` | `prompts/review-en-v2.ts` |
| `v1.6-rc4` | pl | `v1.6-rc4` | `prompts/review-pl-v1_6-rc4.ts` |
| `v1.6-rc4` | en | `review-en-v3.0.0` | `prompts/review-en-v3.ts` |

Select a variant with the `CV_REVIEW_PROMPT_VARIANT` environment variable. It defaults to `stable`, and an unrecognised value also resolves to `stable`, so production cannot be switched by a typo.

`v1.6-rc1` and `v1.6-rc2` are Polish-only on purpose: English stayed on its stable prompt so each canary measured the Polish rewrite alone, without an English change riding along unnoticed. `v1.6-rc3` is where English catches up — `review-en-v2` carries every rc1–rc3 change (calibration procedure, the category enum's knock-on effects, the ats.findings scope rule), adapted rather than translated where Polish grammar has no English equivalent: section 16 (gender neutrality) covers pronoun inference instead of verb-ending forms, and section 17 (language hygiene) covers writing natural English when the CV is in another language, the mirror of the Polish original. From `v1.6-rc3` onward, selecting the variant moves both locales together.

## Provenance: never compare two reports blindly

**Do not compare any two reports without first checking `promptVersion` and the model.** A difference in wording, score or issue count is only attributable to the prompt when everything else matches.

Each analysis stores its provenance in `analyses.review_provenance` (JSONB, server-side only — it is never part of the payload sent to the browser):

- `promptVersion`, `promptVariant`
- `rubricVersion`
- `pipelineVersion` — the server-side report pipeline (`REVIEW_PIPELINE_VERSION` in `src/lib/ai/review-provenance.ts`). Bump it when segmentation, evidence validation, suggestion downgrades or action normalisation change, because those alter a stored report even for identical model output.
- `model`, `requestedModel`, `fallbackUsed` — the fallback model can silently replace the requested one on a retryable error
- `modelConfig` — `maxOutputTokens`, `timeoutMs`, `fallbackDisabled`, `responseFormat`, `store`
- `pricing` — the resolved per-model rate and whether it came from the table, the environment or nothing
- `calibrationViolations` — categories scored above the cap their own issues imply
- `droppedAtsFindings` — out-of-scope ATS findings the server removed, counted against raw model output. Without it a silent filter is indistinguishable from a prompt that stopped generating them; watch it fall to zero on `v1.6-rc3`. Read the aggregate in diagnostics under `atsScope`.

Read it back per environment with `GET /api/admin/diagnostics`, field `reviewProvenance`: one row per distinct prompt/model/pipeline combination.

Analyses created before this field existed keep `null` and are reported as `legacy_unknown`. They were deliberately **not** backfilled — relabelling them would attribute provenance those reports never had.

## Current candidate and the Natalie baseline

The candidate under test is **`v1.6-rc4`**, now covering both locales. Each step added one thing on top of the last, and every earlier version stays byte-for-byte intact — analyses are already attributed to each:

- `v1.6-rc1`: the initial rewrite (see below).
- `v1.6-rc2`: rc1 plus a mandatory score-calibration procedure.
- `v1.6-rc3`: rc2 plus a scope rule confining `ats.findings` to parsing and structure, never matching against a job posting.
- `v1.6-rc4`: rc3 plus an EXPOSE attribution rule (see the bug writeup below).

The `ats.findings` scope rule (rc3) exists because models filed "no job description was supplied" as an ATS warning in five separate runs, each worded differently. That is neither document hygiene nor a flaw in what a `full_review` reader bought, since the offer comparison is a separately paid plan. The server-side filter in `validate-report` stays in place regardless of the prompt, because this text is user-visible and commercially sensitive, and prompt rules have repeatedly proven model-dependent — it drops such findings only when no offer was supplied, so a real keyword gap against a `job_match` offer is kept.

## A production-affecting bug found while reviewing rc3 output

An rc3 run scored issue "Najmocniejszy dowód seniority jest zakopany w starszej roli" as `QUESTION` with the generic fallback action "Doprecyzuj brakujące fakty…", even though the model's own action plan already stated the correct fix (move the Railbird result higher). The `factualityNote` matched the hardcoded downgrade string in `validate-report.ts` exactly — this was never the model's choice of type. The model most likely returned `EXPOSE`; the server's own guard vetoed it.

`excessiveSemanticNovelty` flagged the proposal's tokens as unsupported by the cited evidence. Reproducing it with the run's actual evidence and a faithful paraphrase (see `tests/expose-novelty-guard.test.ts`) isolated two independent causes:

- **Polish inflection**: `zmniejszenie`/`zmniejszyła`, `ograniczenie`/`ograniczyła`, `najnowszego`/`najnowsza` are the same fact in different grammatical forms, but the guard compared exact token spellings, so every inflected form counted as "new". Fixed with a 6-character-prefix stem comparison — a near no-op for English, which barely inflects.
- **Restructuring vocabulary**: EXPOSE inherently writes new connective language when it repositions a fact ("warto wyeksponować obok najnowszego doświadczenia" — "worth surfacing next to the most recent role"). None of those words are facts, but none were in the cited evidence either. Added a `repositioningStopwords` list (both locales) so this class of words no longer counts against novelty.

Both fixes together took the reproduction's novel-token count from 9 to 0, while the existing fabrication-detection tests (a genuinely invented "mentoring" claim, a fabricated headcount number) still trigger the downgrade correctly — the fix narrows the guard, it does not disable it.

This lives in shared code (`validate-report.ts`), not in any prompt file, so it affects **every** prompt including the `stable` one currently in production — a live bug independent of the v1.6 canary. `REVIEW_PIPELINE_VERSION` moved to `report-pipeline-v4` accordingly.

The QUESTION-vs-EXPOSE distinction itself was not added to the prompt: the model's classification was already correct in the case that exposed this, so a prompt patch aimed at that choice would not have fixed the observed defect. `v1.6-rc4` does add one narrower, independently-motivated rule: preserve employer/time-period attribution when EXPOSE moves an achievement toward the top of the document, so repositioning cannot make an older role's result look like it belongs to the current one.

`v1.6-rc2` was: the verbatim `v1.6-rc1` text plus a mandatory score-calibration procedure inserted as section 19 (the three trailing sections are renumbered). `v1.6-rc1` is left byte-for-byte intact, because four analyses are already attributed to it.

`v1.6-rc2` ships together with two changes that make its central rule enforceable rather than aspirational:

- `issue.category` is now an enum over the seven rubric keys. As a free string, models answered with invented labels — `gpt-5.6-luna` returned `"Design systemy i wpływ na produkt"`, a category that does not exist — which silently broke every rule tying an issue to its category. Structured Outputs enforces the enum at generation time.
- `auditCalibration` records every category scored above the cap its own issues imply (79 for `important`, 65 for `critical`) into `review_provenance.calibrationViolations`, aggregated in diagnostics under `calibration`. It reports; it does not clamp. Clamping would change results instead of measuring them.

Because the schema changed, `REVIEW_PIPELINE_VERSION` moves to `report-pipeline-v3`. An rc1 run and an rc2 run therefore differ in prompt *and* pipeline — inherent to this change, and visible in provenance rather than hidden.

Measured on one CV, four models on `v1.6-rc1`, calibration diverged far more than expected: overall 77 (`gpt-5.6-terra`) to 89 (`gpt-5.4-mini`), with `gpt-5.4-mini` scoring `ownership` 86 while carrying an `important` ownership issue — a direct breach of the rule the prompt already stated. That measurement is what `v1.6-rc2` and the audit exist to move.

The Natalie Kerrigan baseline was produced by the **old prompt** (`review-pl-v3.3.0`), before the v1.6-rc1 rewrite. That baseline also predates provenance recording, so its stored row has no `review_provenance`. Treat it as `legacy/unknown` metadata with a known prompt version, not as a fully attributed run.

The baseline was additionally read *after* the report-pipeline fixes of 2026-08-18 (bullet-aware segmentation, suggestion/action realignment, empty proposed-text removal), which is why the run ledger records `fixed-code`.

### Run ledger

| Label | Prompt | Pipeline | Model | Status |
| --- | --- | --- | --- | --- |
| `natalie / old-prompt / fixed-code / baseline` | `review-pl-v3.3.0` | `report-pipeline-v2` | `gpt-5.4-mini` | recorded, qualitative only |
| `natalie / v1.6-rc1 / gpt-5.4-mini / run-1` | `v1.6-rc1` | `report-pipeline-v2` | `gpt-5.4-mini` | overall 89, ownership 86 with an important ownership issue → cap breach |
| `natalie / v1.6-rc1 / gpt-5.6-sol / run-1` | `v1.6-rc1` | `report-pipeline-v2` | `gpt-5.6-sol` | overall 82; ran 90.9s against the then-90s timeout |
| `natalie / v1.6-rc1 / gpt-5.6-terra / run-1` | `v1.6-rc1` | `report-pipeline-v2` | `gpt-5.6-terra` | overall 77, the strictest calibration of the four |
| `natalie / v1.6-rc1 / gpt-5.6-luna / run-1` | `v1.6-rc1` | `report-pipeline-v3`* | `gpt-5.6-luna` | overall 84; invented a category outside the rubric |
| `natalie / v1.6-rc2 / <model> / run-1` | `v1.6-rc2` | `report-pipeline-v3` | resolved at run time | not yet run |

\* The luna run predates the pipeline bump; its stored provenance reads `report-pipeline-v2`. Only the four rc1 rows above share a comparable pipeline.

Category cap breaches are only verifiable for `gpt-5.4-mini`: the other three returned free-text category names, which is exactly what the enum now prevents.

Fill `<model>` from the run's own `promptVersions`/`model` output rather than from the environment variable, so a silent fallback to `OPENAI_REVIEW_FALLBACK_MODEL` is visible in the label.

## Single canary run (not the full paid matrix)

The full matrix is 26 cases × 2 locales. For a prompt canary, run one case in one locale:

```bash
CV_REVIEW_PROMPT_VARIANT=v1.6-rc1 \
OPENAI_EVAL_CASE_IDS=26-natalie-senior-frontend \
OPENAI_EVAL_LOCALES=pl \
pnpm eval:live
```

That is a dry run: it prints the resolved prompt variant, versions, pipeline version and the worst-case cost, and makes no paid call. Add `-- --execute` only after confirming the budget.

`v1.6-rc1` is roughly an order of magnitude longer than the stable prompt, so the cost preflight is materially higher per call; the estimator reads the active prompt rather than a hardcoded one.
