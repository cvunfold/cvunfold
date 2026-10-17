import { describe, expect, it } from "vitest";
import { createMockReport } from "@/lib/ai/mock-report";
import { normalizeReportRecommendations } from "@/lib/ai/report-recommendations";
import { buildRevisionBrief } from "@/lib/ai/report-brief";
import { validateEvidence, withRecruiterPerspective } from "@/lib/ai/validate-report";

function exposureReport(locale: "pl" | "en") {
  const report = createMockReport("first_job", false, "frontend_developer", locale);
  report.evidenceMap = {
    seg_profile: locale === "pl" ? "Chcę rozpocząć pracę jako Frontend Developer." : "I want to start working as a Frontend Developer.",
    seg_project: locale === "pl" ? "Samodzielnie dodałam filtrowanie produktów w React do projektu kursowego." : "I independently added React product filtering to a course project.",
  };
  report.issues = [{ ...report.issues[0], id: "profile", category: "clarity", diagnosticKind: "weak_exposure",
    evidenceRefs: ["seg_profile", "seg_project"], action: "Confirm missing project facts before rewriting the profile.",
    suggestion: { type: "question", original: report.evidenceMap.seg_profile, proposed: null, factualityNote: "Facts are missing." } }];
  report.nextSteps = [{ ...report.nextSteps[0], issueId: "profile", action: "Highlight the existing project in the profile." }];
  return report;
}

describe("consistent report recommendations", () => {
  it.each(["pl", "en"] as const)("repairs the final-report regression on read and in the AI brief (%s)", locale => {
    const input = exposureReport(locale);
    const report = withRecruiterPerspective(input);
    expect(report.issues[0].suggestion?.type).toBe("expose");
    expect(report.issues[0].suggestion?.proposed).toBeNull();
    expect(report.nextSteps[0].action).toBe(report.issues[0].action);
    const brief = buildRevisionBrief(input, locale);
    expect(brief).toContain(report.issues[0].action);
    expect(brief).not.toContain("Confirm missing project facts");
    expect(brief).toContain(locale === "pl" ? "nie zadawaj pytań o nowe osiągnięcia" : "do not ask about new achievements");
    expect(report.summary).toEqual(input.summary);
    expect(report.categoryScores).toEqual(input.categoryScores);
    expect(normalizeReportRecommendations(report)).toEqual(report);
    expect(input.issues[0].suggestion?.type).toBe("question");
  });
  it.each(["pl", "en"] as const)("discards a fabricated exposure draft without asking for already documented facts (%s)", locale => {
    const input = exposureReport(locale);
    input.issues[0].suggestion = { type: "expose", original: input.evidenceMap!.seg_profile,
      proposed: "Led 50 engineers using Kubernetes and AWS.", factualityNote: "" };
    const report = validateEvidence(input, new Set(Object.keys(input.evidenceMap!)), input.evidenceMap);
    expect(report.issues[0].suggestion).toMatchObject({ type: "expose", proposed: null });
    expect(report.nextSteps[0].action).toBe(report.issues[0].action);
    expect(buildRevisionBrief(report, locale)).not.toContain("50 engineers");
  });
  it("keeps real gaps as questions and aligns a rejected rewrite with its plan", () => {
    const input = exposureReport("en");
    input.issues[0].category = "ownership";
    input.issues[0].diagnosticKind = "unattributed_contribution";
    input.issues[0].suggestion = { type: "rewrite", original: input.evidenceMap!.seg_profile,
      proposed: "Led 50 engineers using Kubernetes and AWS.", factualityNote: "" };
    const report = validateEvidence(input, new Set(Object.keys(input.evidenceMap!)), input.evidenceMap);
    expect(report.issues[0].suggestion?.type).toBe("question");
    expect(report.nextSteps[0].action).toBe(report.issues[0].action);
  });
  it("does not infer existing facts from missing evidence or an unsupported reference", () => {
    const input = exposureReport("en");
    input.issues[0].evidenceRefs = ["missing"];
    expect(normalizeReportRecommendations(input).issues[0].suggestion?.type).toBe("question");
    input.issues[0].evidenceRefs = ["seg_profile"];
    input.evidenceMap = {};
    expect(normalizeReportRecommendations(input).issues[0].suggestion?.type).toBe("question");
  });
});
