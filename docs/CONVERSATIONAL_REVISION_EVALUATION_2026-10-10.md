# Questions before CV revision: implementation and evaluation

The copied revision summary now requests the CV, asks up to three specific questions about missing facts, and stops before proposing edits. It waits for the user's answers, accepts negative, uncertain or skipped answers, and asks follow-up questions when necessary. It never supplies example answers on the user's behalf. Proposed changes must identify which answer supports each newly supplied fact and retain course work, guided implementation and mentor context. Reports with no recommendations do not manufacture gap questions.

The full-report section shows three compact steps, a collapsed readable text preview, a copy button and localized success/manual-fallback messages. PL/EN are supported. The briefing is derived locally from existing authorized report actions. No additional provider call, stored conversation or content analytics is introduced.

## Controlled synthetic conversation

The starting point is the same Polish course-project CV previously scored 38. The first turn, executed by the evaluation agent using the copied instructions, asked about independent additions, actual checks and component structure, without editing the CV. Predeclared synthetic answers came only from the established `release-verification-only` fixture: the small cart extension and its manual checks. Component structure was left unconfirmed. This is a staged fictional conversation, not a claim that the original CV already proved those facts or a benchmark of instruction-following across external AI products.

Positive answers added only those established facts to the same CV, preserving course origin, technologies, identity, education and language levels. The project moved earlier. Negative/unknown answers left the original PDF unchanged; no hypothetical skills were added. Each added project statement is traceable to the established fixture and supplied answers. PL/EN PDFs were one page, extracted correctly and visually checked.

| Variant | Score | Findings |
| --- | ---: | --- |
| Original PL, fresh control | 33 | 2 important: contribution and verification |
| Confirmed answers PL | 61 | 1 minor: undocumented code structure |
| Confirmed answers PL, repeat | 60 | Same minor code-structure finding |
| Negative/unknown answers PL | 35 | Contribution and verification remain important; code structure minor |
| Original EN, fresh control | 33 | 2 findings |
| Confirmed answers EN | 67 | No findings |

These results support a useful question-and-answer process for this fixture: confirmed attribution and manual checks resolve the relevant findings; wording or negative answers cannot create those proofs. The score improvement is due to newly supplied facts, not a guaranteed reward for using AI.

Remaining calibration difference: EN assigns architecture 44 with indirect evidence for the explicitly stated empty-cart display-condition choice, while PL retains architecture 20 and a minor missing-structure finding. Both refer to supplied facts; no component layout was invented. The initial runner assertion that architecture must stay exactly 20 was too restrictive. The completed EN response was manually reviewed and retained, not retried. The PL/EN score difference is 6 points (7 versus the PL repeat). Category weights and analysis prompts were not changed in this feature.

## Verification and runtime

- 489 unit tests in 57 files pass, including ordered phases, waiting, no fabricated answers, no compulsory gap questions for clean reports, full-access-only rendering, clipboard success/failure and no content analytics. The final focused 32 tests also pass.
- Lint, typecheck and local production build pass. Vercel Preview builds pass.
- Browser checks: PL/EN at desktop and 390px mobile, collapsed/expanded text, copied status and the actual private 61-point report. No horizontal overflow. EN sample console has no warnings/errors. Private unpaid access excludes the revision section until a server-side Preview test grant.
- Six actual report analyses, all GPT-6 Luna, runtime `preview`, unpaid, no fallback. Rubric `technical-v1.5.0`, career policy `career-v2.2.0`, unchanged analysis prompts. Valid evidence references and fixed no-evidence scores checked.
- Application-estimated model cost USD 0.021218. Conservative threefold reserve USD 0.063654 stays below USD 0.10. This is application telemetry, not a provider invoice.
- One quota rejection occurred before provider execution after two successful cases. The branch-only Preview allowance temporarily increased from 30/hour and 50/day to 50/hour and 100/day for the remaining four, then was restored to 30/hour and 50/day before the final build. Quota records and client identity were not changed. Production limits were unchanged.
