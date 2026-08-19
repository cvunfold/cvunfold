# Anonymous role statistics — legitimate-interest assessment

Status: engineering assessment for owner acceptance and independent legal review. This is not a legal opinion.

## Purpose

Measure whether CVUnfold acquisition reaches people whose CV communicates a supported technical role, another IT role, or no clear role — and, for traffic that misses the product entirely, which broad off-target profession it actually is (e.g. healthcare, legal, construction), so mistargeted ad spend can be diagnosed rather than left as one undifferentiated bucket. Use the result only to improve product positioning and broad campaign targeting, never to make a decision about a person.

### Reassessment: 2026-08-19, expanding the non-IT category

The original design used a single `non_it` catch-all. This reassessment (required by the review gate below before adding a dimension) replaces it with a closed set of fourteen specific non-IT categories plus one residual catch-all (`other_non_it`) — see `docs/PRIVACY_AND_RETENTION.md` for the full list. The mechanism is unchanged: same fixed enum validated at the database constraint, same two source buckets, same cumulative-count-only table, same five-analysis suppression threshold. Finer buckets mean more of them individually fall under five analyses at current traffic and stay suppressed — the safeguard gets *more* conservative as granularity increases, not less. The owner explicitly declined an open, model-driven classification (unbounded vocabulary) in favor of this closed list specifically because an open vocabulary would defeat both the fixed-enum guarantee and the suppression threshold. This reassessment is still an engineering note, not the independent legal review the conclusion below calls for.

## Proposed legal basis

Article 6(1)(f) GDPR: CVUnfold's legitimate interest in measuring audience and acquisition fit. Producing the requested report remains part of delivering the service; only the brief additional processing needed to increment the anonymous counter relies on this assessment.

## Necessity

- The target role selected in the form is not an adequate substitute because it may be left at its default value.
- Manual review of CVs would expose substantially more personal information.
- Retaining a role per analysis would be more intrusive and is not necessary.
- A closed set of category values (broad IT/unclear buckets plus a bounded list of specific non-IT professions) and two source buckets answer the business question without keeping individual-level statistics. The category count grew from four to seventeen, but the shape of what is retained per cell — one cumulative count, nothing else — did not change.
- The non-IT list is bounded and fixed at the code/schema level; it is not the model choosing an unbounded label. A category not on the list falls into `other_non_it` rather than being invented.

## Balancing and safeguards

- The processing does not affect access, price, report content, advertising shown to the person or any recruitment decision.
- Job role is not intentionally combined with protected characteristics; the classifier never creates protected-trait categories.
- The aggregate table stores only role category, `google_cpc|other` and a cumulative count.
- No analysis/report ID, raw role, timestamp, locale, model, prompt, IP, filename, click ID, UTM, CV or report content is retained in the aggregate.
- The raw perceived role remains in the report only and is deleted with the report or after 30 days.
- Data is not sent to Google or another analytics provider.
- The table has RLS enabled, no `anon` or `authenticated` access and explicit service-role-only grants.
- Admin diagnostics suppress role cells below five analyses.
- The privacy notice explains the purpose, basis, categories, retention outcome and right to object to future aggregation.

## Conclusion and review gate

The implemented aggregate is a less intrusive way to answer the acquisition-fit question than individual analytics. Owner acceptance and an independent Polish/EU privacy review remain separate from engineering completion. Reassess this document before adding dimensions, exporting counters, using results for individual decisions or processing at materially larger scale.
