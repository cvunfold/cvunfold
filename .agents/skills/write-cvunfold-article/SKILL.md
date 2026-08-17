---
name: write-cvunfold-article
description: Draft, edit, adapt, or review CVUnfold knowledge articles in Pawel's calibrated author voice with evidence checks, search-intent and cannibalization gates, natural Polish, idiomatic English, and a no-publish review bundle. Use for new CVUnfold article briefs, rewrites, editorial audits, translations, or article proposals produced by the weekly growth review.
---

# Write CVUnfold articles

Create useful editorial content that sounds like a specific, technically literate author. Optimize for reader value and trust, not for AI-detector scores.

## Load the required context

1. Read [references/pawel-voice.md](references/pawel-voice.md) before drafting or rewriting public copy.
2. Read [references/editorial-quality.md](references/editorial-quality.md) before the final edit.
3. Inspect `src/lib/content/articles.ts` and `src/lib/content/articles-en.ts` when working in the CVUnfold repository. Check topic overlap, repeated examples, vocabulary, internal-link targets, and existing claims.
4. Identify the reader, search intent, source of the topic, evidence available, intended new value, and desired CTA.
5. Respect the repository's ownership and privacy rules. Never expose CV, report, prompt, token, filename, or PII content.

## Decide whether the article should exist

Choose exactly one outcome:

- Draft a new article only when the topic answers a real reader problem and adds a specific idea, example, decision, or synthesis not already covered.
- Update an existing article when the query belongs to an existing intent or the new value fits naturally on an existing page.
- Recommend no article when evidence is weak, the topic is merely adjacent to a keyword, or the useful answer is too thin.

State the decision and reason before drafting. Do not manufacture a topic to satisfy a publishing cadence.

## Build an editorial brief

Write down:

- the reader's concrete problem;
- the answer in one or two sentences;
- the author's thesis;
- facts requiring sources;
- author judgments that may be stated firmly but must remain identifiable as judgments;
- one or more real, sourced, or clearly illustrative examples;
- overlap with existing articles;
- the action the reader should be able to take afterward.

Stop and report the missing input when the argument depends on unavailable evidence. Never invent research, statistics, quotations, customers, recruiter behavior, or first-person experience.

## Draft in Polish

1. Give the useful answer near the beginning. Do not delay the point to create suspense.
2. Let the material determine the number and length of sections. Do not default to four sections, two paragraphs per section, an FAQ, or a checklist.
3. Make each paragraph earn its place through a new claim, example, consequence, distinction, or action.
4. Prefer concrete verbs and objects over sequences of abstract nouns.
5. Address the reader directly when giving practical guidance.
6. Apply the calibrated strength, disagreement, jargon, evidence, and humor settings from the voice profile.
7. Use examples to clarify the argument, not to make the article look complete.
8. Add the CTA only where it follows from the reader's problem. Do not interrupt an educational point with a sales pitch.

## Adapt into English

Write the English version as an idiomatic adaptation after the Polish argument is stable. Preserve evidence and meaning, but rebuild sentences, transitions, headings, and industry language for an English-speaking reader. Do not translate line by line.

## Perform the editorial edit

1. Cut the warm-up, repeated conclusion, generic transition, and sentence that could appear unchanged on any career blog.
2. Replace unsupported universal claims with evidence, a narrower claim, or an explicit author judgment.
3. Break mechanical symmetry when the content does not justify it.
4. Remove repeated contrast formulas, forced lists of three, and excessive use of the same brand vocabulary.
5. Keep humor only when it exposes a truth or sharpens recall. Never joke at the reader's expense or add humor to satisfy a quota.
6. Read the draft aloud mentally. Rewrite phrases that are grammatical but unlikely to be spoken or written by a fluent human author.
7. Run the local audit:

   `node .agents/skills/write-cvunfold-article/scripts/audit-article.mjs <draft.md> --lang pl`

Treat audit warnings as prompts for editorial judgment, not automatic failures.

## Return a review bundle

Return:

1. publication decision and editorial brief;
2. complete draft;
3. source list and fact-check notes;
4. author judgments that should remain visibly opinions;
5. cannibalization and internal-link notes;
6. CTA rationale;
7. audit result and any remaining editorial risks;
8. humor lines called out separately while the humor calibration remains provisional.

Do not publish, replace production content, commit, push, deploy, or update an automation unless the user explicitly asks for that separate action.
