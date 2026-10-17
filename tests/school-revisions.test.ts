import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const fake=vi.hoisted(()=>({authorize:vi.fn(),package:vi.fn(),rpc:vi.fn(),review:vi.fn(),quota:vi.fn()}));
vi.mock("@/lib/schools/data",()=>({authorizedSchoolAnalysis:fake.authorize}));
vi.mock("@/lib/schools/package",()=>({readSchoolPackage:fake.package}));
vi.mock("@/lib/schools/server",async original=>({...await original<object>(),schoolDatabase:()=>({rpc:fake.rpc})}));
vi.mock("@/lib/ai/openai-review",()=>({reviewWithOpenAI:fake.review}));
vi.mock("@/lib/document-parsing",()=>({parseDocument:vi.fn(async()=>({text:"Frontend Developer React projects experience skills education ".repeat(20),segments:[]}))}));
vi.mock("@/lib/ats-checker",()=>({runAtsChecker:vi.fn(async()=>({score:90,checks:[]}))}));
vi.mock("@/lib/security/rate-limit",()=>({rateLimit:()=>true,consumeAnalysisQuota:fake.quota}));
import { POST } from "@/app/api/schools/reports/[id]/revisions/route";
import { createMockReport } from "@/lib/ai/mock-report";
import { SchoolError } from "@/lib/schools/server";
import { getReviewPrompt } from "@/lib/ai/prompts";
import { reviewPromptVersion } from "@/lib/ai/review-prompt-version";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
import { RUBRIC_VERSION } from "@/lib/rubrics/technical-v1";
let item: ReturnType<typeof makeItem>;
function makeItem(){const report=createMockReport("first_job",false,"frontend_developer","pl","first_job");report.promptVersion=reviewPromptVersion(getReviewPrompt("pl","first_job","first_job","frontend_developer").version,true);report.rubricVersion=RUBRIC_VERSION;return{id:randomUUID(),paid:true,locale:"pl",report,provenance:{model:"gpt-6-luna",pipelineVersion:REVIEW_PIPELINE_VERSION},expiresAt:new Date(Date.now()+86400000)};}
function request(overrides:Record<string,string>={},origin="http://localhost"){const form=new FormData();form.set("file",new File(["%PDF-1.7 fixture"],"synthetic.pdf",{type:"application/pdf"}));form.set("requestId",randomUUID());form.set("schoolConsent","true");for(const[k,v]of Object.entries(overrides))form.set(k,v);return new Request(`http://localhost/api/schools/reports/${item.id}/revisions`,{method:"POST",headers:{origin},body:form});}
const context=()=>({params:Promise.resolve({id:item.id})});
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("MOCK_MODE","true");vi.stubEnv("OPENAI_REVIEW_MODEL","gpt-6-luna");item=makeItem();fake.authorize.mockResolvedValue({analysis:item,member:{schoolId:"school-owner",userId:"mentor"},groupId:"group-owner"});fake.package.mockResolvedValue({paid:false});fake.quota.mockResolvedValue({allowed:true});fake.rpc.mockImplementation(async(name:string)=>({data:name==="reserve_school_revision"?{version:1,status:"running"}:true,error:null}));});
afterEach(()=>vi.unstubAllEnvs());
describe("school recheck authorization and state",()=>{
 it("rejects cross-origin requests before authorization",async()=>{expect((await POST(request({},"https://other.example"),context())).status).toBe(403);expect(fake.authorize).not.toHaveBeenCalled();});
 it("rejects a foreign report without generating or reserving",async()=>{fake.authorize.mockRejectedValue(new SchoolError(404,"Brak raportu"));expect((await POST(request(),context())).status).toBe(404);expect(fake.rpc).not.toHaveBeenCalled();expect(fake.review).not.toHaveBeenCalled();});
 it("requires confirmed payment before a recheck",async()=>{item.paid=false;expect((await POST(request(),context())).status).toBe(403);expect(fake.rpc).not.toHaveBeenCalled();});
 it("accepts a paid group without marking its report individually paid",async()=>{item.paid=false;fake.package.mockResolvedValue({paid:true});expect((await POST(request(),context())).status).toBe(200);expect(item.paid).toBe(false);});
 it("retains root identity and ignores forged role, stage and school",async()=>{expect((await POST(request({role:"backend_developer",seniority:"senior",schoolId:"foreign"}),context())).status).toBe(200);const reservation=fake.rpc.mock.calls.find(([name])=>name==="reserve_school_revision")![1];expect(reservation).toMatchObject({p_analysis_id:item.id,p_school_id:"school-owner",p_test:false});const completion=fake.rpc.mock.calls.find(([name])=>name==="complete_school_revision")![1];expect(completion.p_report.document.targetSeniority).toBe("first_job");expect(completion.p_report.document.targetRole).toContain("Frontend");});
 it("does not run or complete another analysis for an already completed request",async()=>{fake.rpc.mockResolvedValue({data:{version:1,status:"complete"},error:null});expect((await POST(request(),context())).status).toBe(200);expect(fake.rpc).toHaveBeenCalledOnce();expect(fake.review).not.toHaveBeenCalled();});
 it("returns an exhausted quota without running a provider",async()=>{fake.rpc.mockResolvedValue({data:null,error:{message:"REVISION_LIMIT"}});expect((await POST(request(),context())).status).toBe(409);expect(fake.review).not.toHaveBeenCalled();});
 it("rejects changed criteria before a provider call",async()=>{vi.stubEnv("MOCK_MODE","false");item.report.promptVersion="previous-version";expect((await POST(request(),context())).status).toBe(409);expect(fake.rpc).not.toHaveBeenCalled();});
 it("accepts the complete live method version for an invoice-backed report",async()=>{vi.stubEnv("MOCK_MODE","false");item.paid=false;fake.package.mockResolvedValue({paid:true,source:"invoice",state:"active"});fake.review.mockResolvedValue({report:item.report,telemetry:{provenance:item.provenance}});expect((await POST(request(),context())).status).toBe(200);expect(fake.review).toHaveBeenCalledWith(expect.objectContaining({targetRole:"frontend_developer",targetSeniority:"first_job",careerContext:"first_job"}));expect(fake.rpc).toHaveBeenCalledWith("complete_school_revision",expect.objectContaining({p_analysis_id:item.id,p_provenance:item.provenance}));});
 it("rejects a base-only version before reserving or generating",async()=>{vi.stubEnv("MOCK_MODE","false");item.report.promptVersion=getReviewPrompt("pl","first_job","first_job","frontend_developer").version;expect((await POST(request(),context())).status).toBe(409);expect(fake.rpc).not.toHaveBeenCalled();expect(fake.review).not.toHaveBeenCalled();});
 it("releases the slot after provider failure",async()=>{vi.stubEnv("MOCK_MODE","false");fake.review.mockRejectedValue(new Error("provider unavailable"));expect((await POST(request(),context())).status).toBe(400);expect(fake.rpc).toHaveBeenCalledWith("release_school_revision",expect.objectContaining({p_analysis_id:item.id,p_school_id:"school-owner"}));});
 it("requires consent for the revised file",async()=>{expect((await POST(request({schoolConsent:"false"}),context())).status).toBe(400);expect(fake.rpc).not.toHaveBeenCalled();});
});
