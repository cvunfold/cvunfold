import { describe, expect, it } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { createMockReport } from "@/lib/ai/mock-report";
import { modelResponseSchema, reportSchema } from "@/lib/ai/schemas/report";
import { normalizeCategoryEvidence, prioritizeFirstJobIssues, alignNextSteps, NO_EVIDENCE_SCORE } from "@/lib/ai/report-policy";
import { validateEvidence, calculateOverall, featuredFreeIssue } from "@/lib/ai/validate-report";

const category = (score: number) => ({ key: "collaboration", label: "Collaboration", score, weight: .17, rationale: "Missing feedback", evidenceRefs: [] as string[], evidenceStatus: "none" as const });

describe("missing-evidence invariance", () => {
  it.each(["pl", "en"] as const)("uses one anchor regardless of the model score (%s)", locale => {
    for (const score of [10, 12, 25, 35, 42, 100]) expect(normalizeCategoryEvidence(category(score), new Set(), locale).score).toBe(NO_EVIDENCE_SCORE);
  });
  it("does not treat invalid references as evidence or retain a positive rationale", () => {
    const normalized = normalizeCategoryEvidence({ ...category(85), evidenceStatus: "concrete", rationale: "Strong teamwork", evidenceRefs: ["seg_invented"] }, new Set(["seg_real"]), "en");
    expect(normalized).toMatchObject({ score: 20, evidenceStatus: "none", evidenceRefs: [] });
    expect(normalized.rationale).not.toContain("Strong teamwork");
  });
  it("preserves genuinely supported scores", () => {
    const value = { ...category(78), evidenceStatus: "concrete" as const, evidenceRefs: ["seg_feedback"] };
    expect(normalizeCategoryEvidence(value, new Set(["seg_feedback"]), "pl")).toEqual(value);
  });
  it("cannot raise cooperation when only another category's evidence improves", () => {
    const before = createMockReport("first_job");
    before.categoryScores.find(c => c.key === "collaboration")!.evidenceRefs = [];
    before.categoryScores.find(c => c.key === "collaboration")!.score = 10;
    const after = structuredClone(before);
    after.categoryScores.find(c => c.key === "ownership")!.score = 88;
    after.categoryScores.find(c => c.key === "collaboration")!.score = 42;
    const refs = new Set(Object.keys(before.evidenceMap!));
    const a = validateEvidence(before, refs, before.evidenceMap);
    const b = validateEvidence(after, refs, after.evidenceMap);
    expect(a.categoryScores.find(c => c.key === "collaboration")!.score).toBe(20);
    expect(b.categoryScores.find(c => c.key === "collaboration")!.score).toBe(20);
    expect(b.summary.overallScore).toBe(calculateOverall(b.categoryScores));
  });
});

describe("first-job action priorities", () => {
  const make = (id: string, kind: "limited_contribution" | "missing_verification" | "unattributed_contribution") => ({ ...createMockReport("first_job").issues[0], id, diagnosticKind: kind, severity: "important" as const });
  const evidence = [{ ...category(72), key: "ownership", evidenceStatus: "concrete" as const, evidenceRefs: ["seg_own"] }];
  it("acknowledges concrete small work and prioritizes missing verification", () => {
    const result = prioritizeFirstJobIssues([make("scope", "limited_contribution"), make("check", "missing_verification")], evidence);
    expect(result.map(i => i.id)).toEqual(["check", "scope"]);
    expect(result[1].severity).toBe("minor");
  });
  it("keeps genuinely unattributed work important and ahead of verification", () => {
    const result = prioritizeFirstJobIssues([make("check", "missing_verification"), make("who", "unattributed_contribution")], [{ ...category(20), key: "ownership" }]);
    expect(result[0]).toMatchObject({ id: "who", severity: "important" });
  });
  it("does not elevate verification over a critical finding", () => {
    const result = prioritizeFirstJobIssues([make("check", "missing_verification"), { ...make("serious", "unattributed_contribution"), severity: "critical" }], evidence);
    expect(result[0].id).toBe("serious");
  });
  it("keeps the action plan aligned and removes links to discarded findings", () => {
    const step = createMockReport().nextSteps[0];
    const result = alignNextSteps([{ ...step, issueId: "scope" }, { ...step, issueId: "unknown" }, { ...step, issueId: "check" }], [make("check", "missing_verification"), make("scope", "limited_contribution")]);
    expect(result.map(s => [s.issueId, s.priority])).toEqual([["check", 1], ["scope", 2]]);
  });
});

describe("provider contract and historical report compatibility", () => {
  it("accepts historical persisted reports while requiring new provider fields", () => {
    const legacy = createMockReport();
    expect(reportSchema.safeParse(legacy).success).toBe(true);
    expect(modelResponseSchema.safeParse(legacy).success).toBe(false);
  });
  it("requires evidence status, diagnostic kinds and linked steps in strict output", () => {
    const schema = zodTextFormat(modelResponseSchema, "cv_report").schema as { properties: Record<string, { items: { required: string[] } }> };
    expect(schema.properties.categoryScores.items.required).toContain("evidenceStatus");
    expect(schema.properties.issues.items.required).toContain("diagnosticKind");
    expect(schema.properties.nextSteps.items.required).toContain("issueId");
  });
});


describe("honest first-job gap preview", () => {
  it("can feature missing verification without pretending there is a CV quote", () => {
    const report = createMockReport("first_job");
    report.issues = [{ ...report.issues[0], diagnosticKind: "missing_verification", severity: "important", confidence: "high", evidenceRefs: [], suggestion: { type: "gap", original: null, proposed: null, factualityNote: "No verification described" } }];
    const featured = featuredFreeIssue(report);
    expect(featured).toMatchObject({ title: report.issues[0].title, evidenceKind: "gap" });
    expect(featured?.evidence).toContain("brak informacji");
    expect(featured).not.toHaveProperty("action");
    expect(featured).not.toHaveProperty("evidenceRefs");
  });
});
