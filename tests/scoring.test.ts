import { describe, expect, it } from "vitest";
import { applyServerRubric, calculateOverall } from "@/lib/ai/validate-report";
import { getRubric } from "@/lib/rubrics/frontend-v1";
import { createMockReport } from "@/lib/ai/mock-report";
describe("deterministic scoring",()=>{
  it("weights each category",()=>{const categories=getRubric("senior").map(c=>({...c,score:80,rationale:"",evidenceRefs:[]}));expect(calculateOverall(categories)).toBe(80)});
  it("rejects invalid total weights",()=>expect(()=>calculateOverall([{key:"x",label:"x",score:80,weight:.5,rationale:"",evidenceRefs:[]}])).toThrow("INVALID_RUBRIC_WEIGHTS"));
  it("uses different expectations by seniority",()=>expect(getRubric("junior").find(x=>x.key==="ownership")?.weight).toBeLessThan(getRubric("lead").find(x=>x.key==="ownership")!.weight));
  it("replaces model-provided labels and weights with the server rubric",()=>{
    const report=createMockReport("senior");
    report.categoryScores=report.categoryScores.map(category=>({...category,label:"Model label",weight:.14}));
    const normalized=applyServerRubric(report,getRubric("senior"));
    expect(normalized.categoryScores.map(category=>category.weight)).toEqual(getRubric("senior").map(category=>category.weight));
    expect(normalized.categoryScores.map(category=>category.label)).toEqual(getRubric("senior").map(category=>category.label));
    expect(calculateOverall(normalized.categoryScores)).toBeGreaterThan(0);
  });
  it("keeps a complete rubric when the model omits a category",()=>{
    const report=createMockReport("senior");
    report.categoryScores=report.categoryScores.slice(0,1);
    const normalized=applyServerRubric(report,getRubric("senior"));
    expect(normalized.categoryScores).toHaveLength(getRubric("senior").length);
    expect(calculateOverall(normalized.categoryScores)).toBeGreaterThanOrEqual(0);
  });
});
