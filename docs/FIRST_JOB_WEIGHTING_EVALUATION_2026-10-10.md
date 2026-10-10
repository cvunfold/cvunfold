# First-job weights and concise reports

## Behavior

First job now has its own weights: project functionality 15%, personal contribution 15%, technical practice 35%, structure 5%, collaboration 5%, clarity 25%. Junior retains its previous weights. Unsupported categories remain exactly 20/100. Undocumented cooperation now costs at most four overall points relative to 100 in that category, instead of 13.6 with the junior profile.

The first-job prompt separates attribution, behavior, implementation, structure and communication. Reusing a segment is legitimate only when its distinct facts support those different aspects. An attribution word alone cannot raise technical practice or project outcomes. The audit helper identifies reuse for review without arbitrarily discounting a rich segment.

Full reports show detailed instructions once in the issue. Recruiter concerns and the action plan link to that issue. Strengths have one detailed section. Interview-question explanations and a revision summary are collapsed. Legacy reports without issue links retain their original instructions; historical numeric scores are not recomputed.

The localized revision summary is derived from prioritized existing actions, with no extra model call. It can be copied for independent editing or use in another AI. It requires the separately supplied CV and factual answers before adding information. It contains no evidence quotations, contact data, private report link or score. Copying performs no transfer or analytics event. It is only rendered with authorized full access, including synthetic demos and the existing Preview-only test grant.

## Matched live regression

Sixteen successful GPT-6 Luna analyses reused the exact prior PDFs, eight cases in both languages. Provenance confirmed Preview, unpaid and no fallback. All references remained valid, absent evidence stayed 20, linked actions followed issue order and manual checks were acknowledged.

| Fixture | PL | EN |
| --- | ---: | ---: |
| Guided-only | 38 | 34 |
| Small own extension | 53 | 55 |
| Same facts placed earlier | 53 | 53 |
| Broader contribution | 61 | 63 |
| Manual verification | 62 | 64 |
| Peer feedback | 63 | 65 |
| Strong first-job | 80 | 86 |
| Junior after internship | 81 | 80 |

In PL, the original-to-extension increase is 15 overall points, previously 24. Attribution contributes 8.4 unrounded weighted points, approximately 57% of the increase. Functionality contributes 1.05, implementation 2.1 and description clarity 3.25; architecture and collaboration contribute zero. Manual review confirmed the shared references contain separate facts about behavior, attribution and React state/conditions. Earlier placement adds zero overall points in PL and minus two in EN, within ordinary generation variability.

The maximum paired overall difference was six points. Some secondary minor findings vary across languages; the main findings agree. Strong first-job reports had zero manufactured issues. This is a synthetic regression set, not evidence of identical scoring on every independent generation.

Application-estimated additional cost: USD 0.051901, or USD 0.155703 with a threefold retry reserve, below the declared USD 0.50 ceiling. This is not a provider invoice. One request was stopped by the existing hourly quota before model execution; completed fixtures were preserved and only unfinished cases resumed. Temporary branch-only allowances were restored to 30/hour and 50/day. Production allowances were not changed.

## Verification

- 482 tests across 56 files passed; lint, typecheck and local production build passed.
- Vercel built the immutable application source successfully.
- In-app browser checked PL/EN sample reports at desktop width and 390px mobile width, collapsed/expanded summaries, copy success, issue links, and the real 53-point report through unpaid preview and then the approved test grant. No horizontal overflow or framework overlay was observed. The sample view had no relevant console errors; the private Preview initially recorded a Stripe.js network warning on its unpaid payment surface. Actual payments were not exercised in this follow-up.
- The earlier source commit and final source use identical model input, rubric and score normalization; later changes only link sample actions and shorten presentation.

Versions: technical-v1.5.0, career-v2.2.0. Model remains GPT-6 Luna, with one normal analysis call and no call for the revision summary.
