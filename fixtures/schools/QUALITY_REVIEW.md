# Review of the school demo, 2026-10-11

This exercise generated and reviewed examples; it did not train or fine-tune a model. Ten PDF documents were processed with the current frontend / first-job rubric. Output provenance records model, prompt, rubric, tokens and calibration checks.

| Example | Score | Main observation from the reviewed report |
| --- | ---: | --- |
| Anna | 55 | A specific form is recognized as personal contribution; gaps concern verification and code structure. |
| Michał | 39 | Tutorial-based projects and a broad technology list provide limited evidence. |
| Julia | 84 | Tests, decisions and accessibility are credited; the second project's verification remains narrower. |
| Piotr | 86 | Internship scope is correctly distinguished from ownership of architecture or deployments. |
| Zofia | 70 | A non-React project and user feedback receive credit; no commercial IT work is invented. |
| Kacper | 42 | Unsupported senior positioning and unmeasured performance claims are challenged. |
| Natalia | 87 | Concrete work, checks and collaboration are credited without manufactured problems. |
| Adam | 65 | The project is recognized despite the long course list; gaps remain in structure and broader verification. |
| Olga | 54 | Design background is kept separate from implementation; missing verification is not treated as missing ability. |
| Tomasz | 77 | Tests and an architectural decision receive credit despite no framework; collaboration evidence is absent. |

Lessons applied to the presentation:
- Preserve the model's actual diagnoses rather than imposing the author's initial expectation about a case.
- Show source PDFs and parsed text beside reports so users can assess evidence themselves.
- Quote evidence supporting strengths as well as issues.
- Clearly distinguish missing-document evidence from a negative claim about a person.
- Handle a report with no issues without adding artificial recommendations.
- Aggregate only comparable criteria; treat scores as CV communication assessments, not hiring predictions.

Automated corpus checks cover schema validity, deterministic weighted scores, existing source files, exact quoted evidence, comparable rubric/role/stage, calibration audit and null rewrites for GAP/QUESTION. All ten scores are unchanged. These checks and a manual source/report review are not proof that every model judgment is objective or repeatable. Portfolio links are authored placeholders, not independently verified deployments.

Estimated generation cost from the application's pricing table was USD 0.0774, not a billing receipt. Provider storage was disabled. The fixed public corpus incurs no additional AI call on viewing the demo.
