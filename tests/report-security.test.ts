import { describe, expect, it } from "vitest";
import { createMockReport } from "@/lib/ai/mock-report";
import { toTeaser, validateEvidence } from "@/lib/ai/validate-report";
describe("report boundary",()=>{
  it("never includes issues or strengths in teaser",()=>{const teaser=toTeaser(createMockReport());expect(teaser).not.toHaveProperty("issues");expect(teaser).not.toHaveProperty("strengths");expect(JSON.stringify(teaser)).not.toContain("Rozwijałem kluczowe ścieżki")});
  it("drops unsupported evidence",()=>{const report=validateEvidence(createMockReport(),new Set(["seg_exp_1"]));expect(report.strengths.every(s=>s.evidenceRefs.every(r=>r==="seg_exp_1"))).toBe(true);expect(report.issues.some(i=>i.id==="i3")).toBe(false)});
});
