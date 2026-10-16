import { z } from "zod";
import guidedIterations from "../../../fixtures/schools/guided-iterations.json";
import iteration from "../../../fixtures/schools/anna-iteration-reports.json";
import revision from "../../../fixtures/schools/demo-revision.json";
import corpus from "../../../fixtures/schools/reports.json";
import { ATS_CHECK_IDS } from "@/lib/ats-checker/types";
import { reportSchema } from "@/lib/ai/schemas/report";
import { readSchoolContact } from "./contact";
import type { SchoolData, SchoolStudent } from "./model";

const demoReportSchema = reportSchema.extend({
  evidenceMap: z.record(z.string()),
  ats: z.object({ score: z.number().min(0).max(100), checks: z.array(z.object({
    id: z.enum(ATS_CHECK_IDS), status: z.enum(["pass", "warning", "fail", "not_applicable"]), metrics: z.record(z.number()).optional(),
  })) }).optional(),
});

/** Public, deliberately fictional corpus. Model outputs and scores are never fabricated at runtime. */
export function schoolDemoStudents(start = 0, count = 8): SchoolStudent[] {
  return corpus.slice(start, start + count).map((item, index) => ({
    id: item.id, name: item.name, contact: readSchoolContact(item.contact),
    createdAt: item.generatedAt, expiresAt: new Date(Date.parse(item.generatedAt) + 30 * 86400000).toISOString(),
    // Static public examples have full access; this is not a database payment assertion.
    paid: true, report: demoReportSchema.parse(structuredClone(item.report)),
    sample: { title: item.caseTitle, description: item.description, sourceText: item.text, sourceUrl: item.sourceUrl, analyzedAt: item.generatedAt, displayUrl: item.sourceUrl.replace(/\.pdf$/, "-styled.pdf"), template: ["Editorial", "Studio", "Technical", "Classic", "Portfolio"][(start + index) % 5] },
  }));
}
const demoGroups = [
  { id: "demo-guided-iterations", name: `Frontend · ${guidedIterations.length} kursantów`, target_role: "frontend_developer", target_seniority: "first_job" },
  { id: "demo-frontend-evidence", name: "Frontend · pierwsza praca · przykłady PDF", target_role: "frontend_developer", target_seniority: "first_job" },
  { id: "demo-anna-iteration", name: "Anna · przed i po poprawkach", target_role: "frontend_developer", target_seniority: "first_job" },
];

export function schoolIterationDemoData(): SchoolData {
  const before = demoReportSchema.parse(structuredClone(iteration.before.report));
  const after = demoReportSchema.parse(structuredClone(iteration.after.report));
  const student = schoolDemoStudents(0, 1)[0];
  return { schoolName: "Akademia Kodu · fikcyjna szkoła", groupId: "demo-anna-iteration", groups: demoGroups, students: [{ ...student,
    report: after, initialReport: before, latestVersion: 1, createdAt: iteration.before.createdAt,
    comparisonKey: `${iteration.method.model}:${iteration.method.pipelineVersion}`,
    sample: { ...student.sample!, title: "Pierwsza praca · pytania, odpowiedzi i poprawki", description: "Nowe, słabiej opisane CV Anny. Po pierwszej analizie odpowiadamy na pytania z panelu na podstawie ustalonego wcześniej rejestru fikcyjnych faktów. Dopiero wtedy AI przygotowuje poprawkę.", sourceUrl: iteration.before.sourceUrl, displayUrl: iteration.before.sourceUrl, analyzedAt: iteration.before.createdAt, sourceText: iteration.before.sourceText,
      revision: { createdAt: iteration.after.createdAt, sourceUrl: iteration.after.sourceUrl, sourceText: iteration.after.sourceText, changes: revision.changes, conversation: revision.conversation, brief: revision.brief,
        analysis: { before, after, beforeCreatedAt: iteration.before.createdAt, afterCreatedAt: iteration.after.createdAt } } },
  }] };
}

export function schoolDemoData(): SchoolData {
  return { schoolName: "Akademia Kodu · fikcyjna szkoła", groupId: "demo-frontend-evidence",
    groups: demoGroups, students: schoolDemoStudents(0, 10) };
}

/** Current cohort: eight reviewed iterations and two awaiting a revised upload. */
export function schoolGuidedIterationsData(): SchoolData {
  return {
    schoolName: "Akademia Kodu · fikcyjna szkoła", groupId: "demo-guided-iterations", groups: demoGroups.filter(group => group.id === "demo-guided-iterations"),
    students: guidedIterations.map(item => {
      const before = demoReportSchema.parse(structuredClone(item.before.report));
      const after = demoReportSchema.parse(structuredClone(item.after.report));
      const revisionUploaded = !["lena", "alicja"].includes(item.id);
      return {
        id: `guided-${item.id}`, name: item.name, contact: readSchoolContact(item.contact), paid: true,
        createdAt: item.before.createdAt, expiresAt: new Date(Date.parse(item.before.createdAt) + 30 * 86400000).toISOString(),
        initialReport: revisionUploaded ? before : undefined, report: revisionUploaded ? after : before, latestVersion: revisionUploaded ? 1 : 0,
        comparisonKey: `${item.method.model}:${item.method.pipelineVersion}`,
        sample: {
          title: revisionUploaded ? "Pierwsza praca · samodzielna poprawka według rad" : "Pierwsza analiza · oczekuje na poprawione CV",
          description: revisionUploaded ? "Słabo opisane CV, pytania z panelu i odpowiedzi z faktów ustalonych przed analizą. Poprawka doprecyzowuje wykonaną wcześniej pracę." : "CV po pierwszej analizie. Raport wskazuje pytania i konkretne rady; poprawiona wersja nie została jeszcze przesłana w tej historii demo.",
          sourceText: item.before.sourceText, sourceUrl: item.before.sourceUrl, displayUrl: item.before.sourceUrl,
          analyzedAt: item.before.createdAt, template: item.template,
          revision: revisionUploaded ? {
            process: "guided_self_edit", model: item.method.model, redaction: item.redaction,
            createdAt: item.after.createdAt, sourceText: item.after.sourceText, sourceUrl: item.after.sourceUrl,
            conversation: item.conversation, changes: item.changes,
            analysis: { before, after, beforeCreatedAt: item.before.createdAt, afterCreatedAt: item.after.createdAt },
          } : undefined,
        },
      };
    }),
  };
}
