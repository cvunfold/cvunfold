import { describe, expect, it } from "vitest";
import { createMockReport } from "@/lib/ai/mock-report";
import { toTeaser, validateEvidence, withRecruiterPerspective } from "@/lib/ai/validate-report";
import type { CVReport } from "@/lib/ai/schemas/report";
describe("report boundary",()=>{
  it("never includes paid recruiter details, issues or strengths in teaser",()=>{const teaser=toTeaser(createMockReport());expect(teaser).not.toHaveProperty("issues");expect(teaser).not.toHaveProperty("strengths");expect(teaser.recruiterPerspective).not.toHaveProperty("positiveSignals");expect(teaser.recruiterPerspective).not.toHaveProperty("reservations");expect(JSON.stringify(teaser)).not.toContain("Rozwijałem kluczowe ścieżki")});
  it("drops unsupported evidence",()=>{const input=createMockReport();input.recruiterPerspective.positiveSignals[1].evidenceRefs=["seg_not_supplied"];const report=validateEvidence(input,new Set(["seg_exp_1"]));expect(report.strengths.every(s=>s.evidenceRefs.every(r=>r==="seg_exp_1"))).toBe(true);expect(report.issues.some(i=>i.id==="i3")).toBe(false);expect(report.recruiterPerspective.positiveSignals).toHaveLength(1);expect(report.recruiterPerspective.reservations.some(item=>item.kind==="gap")).toBe(true)});
  it("hydrates recruiter perspective for reports generated before v2",()=>{const legacy=createMockReport() as Partial<CVReport>;delete legacy.recruiterPerspective;const hydrated=withRecruiterPerspective(legacy as CVReport);expect(hydrated.recruiterPerspective.profileSummary).toBe(hydrated.summary.oneSentenceVerdict);expect(hydrated.recruiterPerspective.likelyInterviewQuestions.length).toBeGreaterThan(0)});
});
