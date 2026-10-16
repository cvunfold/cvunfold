import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import pairs from "../fixtures/schools/guided-iterations.json";
import { schoolGuidedIterationsData } from "@/lib/schools/demo";
import { summarizeSchool } from "@/lib/schools/model";
import { schoolRevisionQuestions } from "@/lib/schools/revision-questions";
import { reportSchema } from "@/lib/ai/schemas/report";
import { calculateOverall } from "@/lib/ai/validate-report";
import { createSegments } from "@/lib/document-parsing";

describe("guided self-edit demonstration histories", () => {
  it("retains real improving pairs, exact PDF hashes and grounded quotations under the same method", () => {
    expect(pairs).toHaveLength(10);
    for (const pair of pairs) {
      expect(pair.review.passed).toBe(true);
      expect(pair.redaction.newProjectWords).toBeLessThan(pair.redaction.oldProjectWords);
      expect(pair.after.sourceSha256).not.toBe(pair.redaction.previousSourceSha256);
      expect(pair.after.sourceUrl).toContain("concise-after.pdf");
      expect(pair.revisedSections[1][1].split("•")).toHaveLength(4);
      expect(pair.method.model).toBe("gpt-6-luna");
      expect(pair.after.report.summary.overallScore).toBeGreaterThan(pair.before.report.summary.overallScore);
      expect(pair.before.report.promptVersion).toBe(pair.after.report.promptVersion);
      expect(pair.before.report.rubricVersion).toBe(pair.after.report.rubricVersion);
      expect(pair.before.report.categoryScores.map(c => [c.key, c.weight])).toEqual(pair.after.report.categoryScores.map(c => [c.key, c.weight]));
      for (const version of [pair.before, pair.after]) {
        const report = reportSchema.parse(version.report);
        expect(report.summary.overallScore).toBe(calculateOverall(report.categoryScores));
        expect(createHash("sha256").update(readFileSync(`public${version.sourceUrl}`)).digest("hex")).toBe(version.sourceSha256);
        const source = createSegments(version.sourceText).map(s => s.text);
        for (const quote of Object.values(version.report.evidenceMap)) expect(source).toContain(quote);
      }
    }
  });
  it("records actual panel questions and answers exclusively from fixed facts without a rewrite prompt", () => {
    for (const pair of pairs) {
      const questions = schoolRevisionQuestions(reportSchema.parse(pair.before.report));
      expect(pair.conversation.map(a => a.issueId)).toEqual(questions.map(q => q.id));
      expect(createHash("sha256").update(JSON.stringify(pair.factLedger)).digest("hex")).toBe(pair.method.factLedgerSha256);
      for (const answer of pair.conversation) {
        const facts = pair.factLedger as Record<string, string>;
        expect(answer.answer).toBe(answer.factKeys.map(key => facts[key]).join(" "));
        expect(answer.recommendation).toBe(questions.find(q => q.id === answer.issueId)?.instruction);
      }
      expect(pair.process).toBe("guided_self_edit");
      expect(pair).not.toHaveProperty("brief");
    }
  });
  it("counts ten candidates once, uses their latest versions and keeps the method separate from archived groups", () => {
    const data = schoolGuidedIterationsData();
    expect(data.students).toHaveLength(10);
    expect(new Set(data.students.map(s => s.id)).size).toBe(10);
    expect(data.students.filter(s => s.latestVersion === 1 && s.sample?.revision?.process === "guided_self_edit")).toHaveLength(8);
    const pending = data.students.filter(s => s.latestVersion === 0);
    expect(pending.map(s => s.name)).toEqual(["Lena Zając", "Alicja Urban"]);
    for (const student of pending) {
      const pair = pairs.find(item => `guided-${item.id}` === student.id)!;
      expect(pair.after.report.summary.overallScore).toBeGreaterThanOrEqual(90);
      expect(student.report?.summary).toEqual(pair.before.report.summary);
      expect(student.report?.categoryScores).toEqual(pair.before.report.categoryScores);
      expect(student.report?.issues).toEqual(reportSchema.parse(pair.before.report).issues);
      expect(student.sample?.revision).toBeUndefined();
      expect(student.initialReport).toBeUndefined();
    }
    expect(summarizeSchool(data.students)).toMatchObject({ count: 10, comparable: true, progress: { count: 8 } });
    expect(data.groupId).toBe("demo-guided-iterations");
  });
});
