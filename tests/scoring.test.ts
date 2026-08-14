import { describe, expect, it } from "vitest";
import { applyServerRubric, calculateOverall } from "@/lib/ai/validate-report";
import { getRubric } from "@/lib/rubrics/technical-v1";
import { createMockReport } from "@/lib/ai/mock-report";
describe("deterministic scoring",()=>{
  it("weights each category",()=>{const categories=getRubric("senior").map(c=>({...c,score:80,rationale:"",evidenceRefs:[]}));expect(calculateOverall(categories)).toBe(80)});
  it("rejects invalid total weights",()=>expect(()=>calculateOverall([{key:"x",label:"x",score:80,weight:.5,rationale:"",evidenceRefs:[]}])).toThrow("INVALID_RUBRIC_WEIGHTS"));
  it("uses different expectations by seniority",()=>expect(getRubric("junior").find(x=>x.key==="ownership")?.weight).toBeLessThan(getRubric("lead").find(x=>x.key==="ownership")!.weight));
  it("treats ATS as hygiene rather than the core senior signal",()=>{const rubric=getRubric("senior");expect(rubric.find(x=>x.key==="ats")!.weight).toBeLessThan(rubric.find(x=>x.key==="ownership")!.weight);expect(rubric.reduce((sum,item)=>sum+item.weight,0)).toBeCloseTo(1)});
  it("adapts specialist categories to the selected role",()=>{
    expect(getRubric("senior","qa_test_automation").find(x=>x.key==="architecture")?.label).toContain("ryzyku");
    expect(getRubric("senior","devops_platform").find(x=>x.key==="credibility")?.label).toContain("operacyjna");
  });
  it("uses balanced general criteria for an automatically inferred experimental role",()=>{
    const rubric=getRubric("auto","other");
    expect(rubric.find(x=>x.key==="ownership")?.weight).toBe(.18);
    expect(rubric.find(x=>x.key==="credibility")?.label).toBe("Wiarygodność zawodowa");
    expect(rubric.find(x=>x.key==="architecture")?.label).toContain("Zakres");
    expect(rubric.reduce((sum,item)=>sum+item.weight,0)).toBeCloseTo(1);
  });
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
