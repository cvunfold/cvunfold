# Synthetic school demonstration corpus

Ten entirely fictional CVs describe different evidence patterns at the same target stage: first professional frontend role. Names, organizations, contacts, project names and portfolio URLs are authored examples, not real candidate data. Addresses use example.com and phone numbers use nonfunctional placeholder digits.

`cvs.json` is the authored source. `public/demo/schools/*.pdf` contains the actual one-page inputs. `reports.json` contains reviewed outputs of the existing PDF parser, ATS checker, OpenAI review, evidence validation and server rubric. Scores are not manually adjusted. The public fixture corpus is intentionally retained to make the requested examples reproducible; live uploads retain the product's normal privacy and paid-access rules.

Generation uses `scripts/generate-school-demo.ts` with the previously owner-approved CVUnfold key, no fallback, bounded output and a cost ceiling. Intermediate outputs are written privately under `/private/tmp/cvunfold-school-demo-reviewed`. `scripts/publish-school-demo.ts` validates the completed corpus before publication. It only normalizes house punctuation, not judgments. `scripts/store-school-demo-group.ts` creates the requested isolated test-school group and stores unpaid reports after explicit ownership and membership checks.

Quality boundaries:
- Compare documents under one role, career stage and rubric version.
- Treat facts in source documents as authored claims, not independently verified achievements.
- Missing descriptions are gaps in visible evidence, not proof of missing skills.
- Preserve exact source quotations; GAP diagnoses intentionally do not manufacture quotations.
- Do not promise employment outcomes, and do not describe this exercise as model training.
- Demo reports are generated once, not recomputed or billed on each page visit.

## Presentation templates and editorial iteration (2026-10-12)

The public viewer now uses `*-styled.pdf` and their PNG renders: five authored layouts (Editorial, Studio, Technical, Classic, Portfolio), including two sidebar layouts. All ten keep the authored source sections and contacts unchanged. Original `*-cv.pdf` files remain the analyzed inputs and are separately downloadable. Existing report scores and ATS checks describe those original inputs, not the new layouts. Each export has a text layer; all section bodies were checked against extracted PDF text and the renders visually inspected.

`anna-questions-case.json` fixes a new, weakly described fictional Anna CV and a richer fictional fact ledger before any analysis. It replaces the earlier editorial-only 78-point example. The ledger is an authored simulation, never a claim about a real student. `anna-questions-start.pdf` and `anna-questions-revised.pdf` are the actual final source documents.

`anna-iteration-reports.json` stores real fresh analyses of these two PDFs using identical unchanged prompts, rubric, model and pipeline. The same school-panel functions produce up to three factual questions and the answer-augmented revision brief. Simulated answers are exact entries from the predeclared fact ledger; a live AI writing request then revises the CV using that brief and those answers. The exported final PDF receives a fresh complete analysis. No score selection or manual score editing occurs. Contact/footer duplication introduced by the writer is removed as document formatting; its earlier PDF/report is kept privately as a diagnostic, not substituted for the final source result.

`demo-revision.json` records the questions, answers, actual brief and source-backed project excerpts. For real students, users supply their own answers in the panel, review the prepared prompt, verify AI edits and upload the corrected PDF. The product does not invent candidate answers or store them in a database.

Observed final result: document quality **71/100 → 98/100**, ATS **100/100 → 100/100**, report issues **4 → 2**. Results concern this fictional example, not a promise or a repeatability study. The before/after group counts one student and stays separate from the historical ten-CV cohort, which uses older criteria. Source SHA-256 hashes and exact parsed source text bind each report to its PDF. Private telemetry and rejected/formatting-stage artifacts remain outside the repository. No evaluation prompts, model settings, environment files or deployment were changed.

## Partial self-edit examples (2026-10-12)

The current ten-person guided group now includes two partial improvements: Oskar 66 → 85 and Emilia 54 → 83. Each revised PDF was assessed once with GPT-6 Luna and the same unchanged prompt, pipeline and rubric as its starting report. The authored revision describes personal contribution, basic state/data handling and only some manual checks from the predeclared facts. Results of those checks and subsequent fixes are deliberately left for a further edit, and the public comparison labels this as a partial improvement. Full original questions, answers and fixed facts remain intact. Scores and report findings are retained exactly as generated; no attempts were repeated to obtain a target score. Matching PDF downloads and PNG previews were replaced together. The other eight guided histories are unchanged.
