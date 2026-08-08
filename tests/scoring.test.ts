import { describe, expect, it } from "vitest";
import { calculateOverall } from "@/lib/ai/validate-report";
import { getRubric } from "@/lib/rubrics/frontend-v1";
describe("deterministic scoring",()=>{
  it("weights each category",()=>{const categories=getRubric("senior").map(c=>({...c,score:80,rationale:"",evidenceRefs:[]}));expect(calculateOverall(categories)).toBe(80)});
  it("rejects invalid total weights",()=>expect(()=>calculateOverall([{key:"x",label:"x",score:80,weight:.5,rationale:"",evidenceRefs:[]}])).toThrow("INVALID_RUBRIC_WEIGHTS"));
  it("uses different expectations by seniority",()=>expect(getRubric("junior").find(x=>x.key==="ownership")?.weight).toBeLessThan(getRubric("lead").find(x=>x.key==="ownership")!.weight));
});
