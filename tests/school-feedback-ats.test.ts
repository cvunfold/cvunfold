import { expect, it } from "vitest";
import { buildFeedbackDraft } from "@/lib/schools/feedback-draft";
import { schoolGuidedIterationsData } from "@/lib/schools/demo";
const report = () => structuredClone(schoolGuidedIterationsData().students[0].report!);
it("uses the saved ATS score and prioritizes failed checks over warnings, ignoring passed checks", () => {
  const r=report();r.ats={score:64,checks:[{id:'sections',status:'warning'},{id:'contact_info',status:'pass'},{id:'text_layer',status:'fail'},{id:'date_format',status:'not_applicable'}]};
  const before=structuredClone(r);
  const body=buildFeedbackDraft('Karolina','Szkoła',r).body;
  expect(body).toContain('Checker ATS ocenił techniczną czytelność pliku na 64/100.');
  expect(body.indexOf('wyeksportuj CV')).toBeLessThan(body.indexOf('sprawdź, czy nagłówki'));
  expect(body).not.toContain('adres e-mail jest zapisany');
  expect(body).not.toContain('stosuj jeden format dat');
  expect(r).toEqual(before);
});
it("does not invent corrections when all available checks pass", () => {
  const r=report();r.ats={score:100,checks:[{id:'text_layer',status:'pass'}]};
  expect(buildFeedbackDraft('Karolina','Szkoła',r).body).toContain('100/100. Nie wskazał problemów technicznych wymagających poprawy.');
});
it("omits ATS feedback when a report has no ATS result", () => {
  const r=report();delete r.ats;
  expect(buildFeedbackDraft('Karolina','Szkoła',r).body).not.toContain('Checker ATS');
});
it("retains a valid zero score", () => {
  const r=report();r.ats={score:0,checks:[{id:'text_layer',status:'fail'}]};
  expect(buildFeedbackDraft('Karolina','Szkoła',r).body).toContain('na 0/100.');
});
it("does not present an unavailable assessment as a technical score", () => {
  const r=report();r.ats={score:0,checks:[{id:'text_layer',status:'not_applicable'}]};
  const body=buildFeedbackDraft('Karolina','Szkoła',r).body;
  expect(body).toContain('Checker ATS nie ma dostępnych kontroli');
  expect(body).not.toContain('na 0/100.');
});
