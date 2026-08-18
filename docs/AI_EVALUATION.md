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

Select a variant with the `CV_REVIEW_PROMPT_VARIANT` environment variable. It defaults to `stable`, and an unrecognised value also resolves to `stable`, so production cannot be switched by a typo. `v1.6-rc1` is Polish-only on purpose: English stays on its stable prompt so a canary measures the Polish rewrite alone.

## Provenance: never compare two reports blindly

**Do not compare any two reports without first checking `promptVersion` and the model.** A difference in wording, score or issue count is only attributable to the prompt when everything else matches.

Each analysis stores its provenance in `analyses.review_provenance` (JSONB, server-side only — it is never part of the payload sent to the browser):

- `promptVersion`, `promptVariant`
- `rubricVersion`
- `pipelineVersion` — the server-side report pipeline (`REVIEW_PIPELINE_VERSION` in `src/lib/ai/review-provenance.ts`). Bump it when segmentation, evidence validation, suggestion downgrades or action normalisation change, because those alter a stored report even for identical model output.
- `model`, `requestedModel`, `fallbackUsed` — the fallback model can silently replace the requested one on a retryable error
- `modelConfig` — `maxOutputTokens`, `responseFormat`, `store`

Read it back per environment with `GET /api/admin/diagnostics`, field `reviewProvenance`: one row per distinct prompt/model/pipeline combination.

Analyses created before this field existed keep `null` and are reported as `legacy_unknown`. They were deliberately **not** backfilled — relabelling them would attribute provenance those reports never had.

## Current candidate and the Natalie baseline

The candidate under test is **`v1.6-rc1`**.

The Natalie Kerrigan baseline was produced by the **old prompt** (`review-pl-v3.3.0`), before the v1.6-rc1 rewrite. That baseline also predates provenance recording, so its stored row has no `review_provenance`. Treat it as `legacy/unknown` metadata with a known prompt version, not as a fully attributed run.

The baseline was additionally read *after* the report-pipeline fixes of 2026-08-18 (bullet-aware segmentation, suggestion/action realignment, empty proposed-text removal), which is why the run ledger records `fixed-code`.

### Run ledger

| Label | Prompt | Pipeline | Model | Status |
| --- | --- | --- | --- | --- |
| `natalie / old-prompt / fixed-code / baseline` | `review-pl-v3.3.0` | `report-pipeline-v2` | as deployed at the time | recorded, qualitative only |
| `natalie / v1.6-rc1 / <model> / run-1` | `v1.6-rc1` | `report-pipeline-v2` | resolved at run time | not yet run |

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
