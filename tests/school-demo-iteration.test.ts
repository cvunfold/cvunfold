import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import pair from "../fixtures/schools/anna-iteration-reports.json";
import { reportSchema } from "@/lib/ai/schemas/report";
import { calculateOverall } from "@/lib/ai/validate-report";
import { createSegments } from "@/lib/document-parsing";
import revision from "../fixtures/schools/demo-revision.json";
import caseData from "../fixtures/schools/anna-questions-case.json";
import { schoolRevisionQuestions, buildSchoolAnsweredBrief } from "@/lib/schools/revision-questions";
import { schoolIterationDemoData } from "@/lib/schools/demo";
import { summarizeSchool } from "@/lib/schools/model";

describe("real Anna demonstration pair", () => {
  it("retains valid reports, source hashes and exact quotations under the same criteria", () => {
    expect(pair.before.report.promptVersion).toBe(pair.after.report.promptVersion);
    expect(pair.before.report.rubricVersion).toBe(pair.after.report.rubricVersion);
    for (const version of [pair.before, pair.after]) {
      const report = reportSchema.parse(version.report);
      expect(version.report.summary.overallScore).toBe(calculateOverall(report.categoryScores));
      expect(createHash("sha256").update(readFileSync(`public${version.sourceUrl}`)).digest("hex")).toBe(version.sourceSha256);
      const segments = createSegments(version.sourceText);
      for (const quote of Object.values(version.report.evidenceMap)) expect(segments.some(s => s.text === quote)).toBe(true);
    }
  });
  it("records the actual school questions, ledger-backed answers and unchanged brief", () => {
    const before = schoolIterationDemoData().students[0].initialReport!;
    const questions = schoolRevisionQuestions(before);
    expect(revision.conversation.map(q => q.issueId)).toEqual(questions.map(q => q.id));
    expect(createHash("sha256").update(JSON.stringify(caseData.factLedger)).digest("hex")).toBe(pair.method.factLedgerSha256);
    for (const answer of revision.conversation) expect(Object.values(caseData.factLedger)).toContain(answer.answer);
    const answers = Object.fromEntries(revision.conversation.map(q => [q.issueId, { status: "confirmed" as const, text: q.answer }]));
    expect(buildSchoolAnsweredBrief(before, answers)).toBe(revision.brief);
  });
  it("counts the latest report once and compares the same student", () => {
    const student = schoolIterationDemoData().students[0];
    expect(student.report?.ats?.score).toBe(pair.after.report.ats.score);
    expect(student.initialReport?.ats?.score).toBe(pair.before.report.ats.score);
    expect(summarizeSchool(schoolIterationDemoData().students)).toMatchObject({ count: 1, comparable: true, average: pair.after.report.summary.overallScore,
      progress: { count: 1, before: pair.before.report.summary.overallScore, after: pair.after.report.summary.overallScore } });
  });
});
