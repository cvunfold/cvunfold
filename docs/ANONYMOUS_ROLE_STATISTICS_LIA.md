# Anonymous role statistics — legitimate-interest assessment

Status: engineering assessment for owner acceptance and independent legal review. This is not a legal opinion.

## Purpose

Measure whether CVUnfold acquisition reaches people whose CV communicates a supported technical role, another IT role, a non-IT role or no clear role. Use the result only to improve product positioning and broad campaign targeting, never to make a decision about a person.

## Proposed legal basis

Article 6(1)(f) GDPR: CVUnfold's legitimate interest in measuring audience and acquisition fit. Producing the requested report remains part of delivering the service; only the brief additional processing needed to increment the anonymous counter relies on this assessment.

## Necessity

- The target role selected in the form is not an adequate substitute because it may be left at its default value.
- Manual review of CVs would expose substantially more personal information.
- Retaining a role per analysis would be more intrusive and is not necessary.
- Four broad categories and two source buckets answer the business question without keeping individual-level statistics.

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
