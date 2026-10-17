import { createMockReport } from "@/lib/ai/mock-report";
import { describe, expect, it } from "vitest";
import { schoolDemoStudents, schoolGuidedIterationsData } from "@/lib/schools/demo";
import { summarizeSchool } from "@/lib/schools/model";

describe("school group summary", () => {
  it("uses the report's scale for score bands and keeps legacy reports on their original thresholds", () => {
    const students = schoolDemoStudents(0, 3);
    for (const [rubricVersion, scores, labels] of [
      ["technical-v2.1.2", [59, 60, 80], ["Duże zmiany · poniżej 60", "Dopracowanie · 60–79", "Drobne poprawki · 80–100"]],
      ["technical-v2.2.0", [65, 66, 89], ["Duże zmiany · poniżej 66", "Dopracowanie · 66–88", "Drobne poprawki · 89–100"]],
    ] as const) {
      students.forEach((student, index) => { student.report!.rubricVersion = rubricVersion; student.report!.summary.overallScore = scores[index]; });
      expect(summarizeSchool(students)).toMatchObject({ bins: [1, 1, 1], binLabels: labels });
    }
  });
  it("averages findings per unlocked CV, includes zeros and excludes minor issues and unpaid reports", () => {
    const students = schoolDemoStudents(0, 3);
    students[0].report!.strengths = students[0].report!.strengths.slice(0, 2);
    const strength = students[0].report!.strengths[0];
    students[0].report!.strengths = [strength, { ...strength, id: "second-strength" }];
    const issue = students[0].report!.issues[0];
    students[0].report!.issues = [{ ...issue, severity: "critical" }, { ...issue, id: "second", severity: "important" }, { ...issue, id: "minor", severity: "minor" }];
    students[1].report!.strengths = []; students[1].report!.issues = [];
    students[2].paid = false;
    expect(summarizeSchool(students)).toMatchObject({ count: 2, averageStrengths: 1, averageImportantIssues: 1 });
    students[0].report!.strengths = []; students[0].report!.issues = [];
    expect(summarizeSchool(students)).toMatchObject({ averageStrengths: 0, averageImportantIssues: 0 });
  });
  it("excludes unpaid reports even if an internal object still holds their full content", () => {
    const students = schoolDemoStudents();
    students[0].paid = false;
    const result = summarizeSchool(students);
    expect(result.count).toBe(7);
    expect(result.average).toBe(Math.round(students.slice(1).reduce((s, p) => s + p.report!.summary.overallScore, 0) / 7));
  });
  it("counts a document once per category, rather than counting every issue", () => {
    const students = schoolDemoStudents(0, 1);
    const issue = students[0].report!.issues[0];
    issue.category = "ownership"; issue.severity = "important";
    students[0].report!.issues.push({ ...issue, id: "duplicate-category" });
    expect(summarizeSchool(students).problems.find(p => p.key === "ownership")?.count).toBe(1);
  });
  it("does not combine different roles, seniorities or rubric versions", () => {
    for (const difference of ["role", "seniority", "rubric"]) {
      const students = schoolDemoStudents();
      if (difference === "role") students[1].report!.document.targetRole = "Backend Developer";
      if (difference === "seniority") students[1].report!.document.targetSeniority = "senior";
      if (difference === "rubric") students[1].report!.rubricVersion = "different";
      expect(summarizeSchool(students)).toMatchObject({ comparable: false, average: null, averageStrengths: null, averageImportantIssues: null, bins: [] });
    }
  });
  it("handles an empty group without NaN or an invented score", () => {
    expect(summarizeSchool([])).toMatchObject({ count: 0, average: null, averageStrengths: null, averageImportantIssues: null });
  });
  it("includes explicitly authorized test reports while keeping their paid flag false", () => {
    const students = schoolDemoStudents(0, 1);
    students[0].paid = false; students[0].testAccess = true;
    expect(summarizeSchool(students).count).toBe(1);
    expect(students[0].paid).toBe(false);
  });
});

it("counts a revised student once and compares the same people before and after", () => {
  const report = createMockReport("first_job", false, "frontend_developer", "pl", "first_job");
  const initial = structuredClone(report); initial.summary.overallScore = 40; report.summary.overallScore = 60;
  const summary = summarizeSchool([{ id: "one", name: "One", paid: true, createdAt: "2026-10-12", expiresAt: "2026-11-12", report, initialReport: initial, latestVersion: 1 }]);
  expect(summary.count).toBe(1); expect(summary.average).toBe(60); expect(summary.progress).toEqual({ count: 1, before: 40, after: 60 });
});

it("compares the whole cohort, including two candidates without a revised upload", () => {
  const students = schoolGuidedIterationsData().students;
  const original = students.map(student => student.initialReport ?? student.report!);
  const result = summarizeSchool(students);
  expect(result.progress?.count).toBe(8);
  expect(result.secondAnalysisCount).toBe(8);
  expect(result.baseline).toEqual({
    count: 10,
    average: Math.round(original.reduce((sum, report) => sum + report.summary.overallScore, 0) / 10),
    averageStrengths: original.reduce((sum, report) => sum + report.strengths.length, 0) / 10,
    averageImportantIssues: original.reduce((sum, report) => sum + report.issues.filter(issue => issue.severity === "important" || issue.severity === "critical").length, 0) / 10,
  });
  expect(result.average).toBe(88);
});
it("excludes unavailable reports from both sides of the comparison", () => {
  const students = schoolGuidedIterationsData().students;
  students[0].paid = false;
  expect(summarizeSchool(students).baseline?.count).toBe(9);
  expect(summarizeSchool(students).count).toBe(9);
});
it("does not show initial metrics when an initial analysis used different criteria", () => {
  const students = schoolGuidedIterationsData().students;
  students[0].initialReport!.rubricVersion = "old-method";
  expect(summarizeSchool(students).baseline).toBeNull();
});
