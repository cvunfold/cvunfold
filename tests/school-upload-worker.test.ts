import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc:vi.fn(), from:vi.fn(), review:vi.fn(), parse:vi.fn(), quota:vi.fn(), clean:vi.fn(), update:vi.fn(), download:vi.fn() }));
vi.mock("@/lib/schools/server",()=>({ schoolDatabase:()=>({rpc:mocks.rpc,from:mocks.from,storage:{from:()=>({download:mocks.download})}}) }));
vi.mock("@/lib/schools/upload-queue",()=>({ schoolQueueEnabled:()=>true,cleanQueueSources:mocks.clean }));
vi.mock("@/lib/schools/package",()=>({ readSchoolPackage:async()=>({paid:true}) }));
vi.mock("@/lib/ai/openai-review",()=>({ reviewWithOpenAI:mocks.review }));
vi.mock("@/lib/document-parsing",()=>({ parseDocument:mocks.parse }));
vi.mock("@/lib/document-parsing/cv-detection",()=>({ validateCvText:vi.fn() }));
vi.mock("@/lib/ats-checker",()=>({runAtsChecker:async()=>({score:90})}));
vi.mock("@/lib/security/rate-limit",()=>({consumeAnalysisQuota:mocks.quota}));
import { runSchoolUploadJob } from "@/lib/schools/upload-worker";
import { REVIEW_PIPELINE_VERSION } from "@/lib/ai/review-provenance";
const base = { id:"job", batch_id:"batch", analysis_id:"analysis", lease_id:"lease", file_name:"CV.pdf", file_size:9,object_key:"opaque", name_manual:false };
function chain(result:unknown) {
  const row:Record<string,unknown> = { then:(resolve:(v:unknown)=>void)=>resolve(result) };
  for(const method of ["select","eq","gt","single","maybeSingle"]) row[method]=()=>row;
  row.update=(data:unknown)=>{mocks.update(data);return row;};return row;
}
beforeEach(()=>{
  vi.clearAllMocks();vi.stubEnv("MOCK_MODE","false");vi.stubEnv("OPENAI_API_KEY","test-no-network");
  mocks.rpc.mockImplementation(async(name:string)=>({data:name==="claim_school_upload_job"?base:true,error:null}));
  mocks.from.mockImplementation((table:string)=>chain({data:table==="school_upload_batches"?{group_id:"group",school_id:"school",method_version:REVIEW_PIPELINE_VERSION}:table==="school_groups"?{target_role:"frontend_developer",target_seniority:"first_job"}:{id:"job"},error:null}));
  mocks.download.mockResolvedValue({data:new Blob(["%PDF test"]),error:null});
  mocks.quota.mockResolvedValue({allowed:true});
  mocks.parse.mockResolvedValue({text:"synthetic",segments:[],sourceStudentName:"Anna Testowa",sourceContact:{emails:["anna@example.com"],phones:[]},diagnostics:{document_kind:"pdf"}});
  mocks.review.mockResolvedValue({report:{document:{},version:"2.1.0"},telemetry:{model:"gpt-6-luna",inputTokens:5,outputTokens:5,estimatedCost:0,provenance:{pipelineVersion:REVIEW_PIPELINE_VERSION}}});
});
afterEach(()=>vi.unstubAllEnvs());
describe("durable school worker",()=>{
  it("runs existing review and ATS then checkpoints before the atomic report transaction",async()=>{
    await runSchoolUploadJob("school");expect(mocks.review).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({student_name:"Anna Testowa",prepared_report:expect.objectContaining({ats:{score:90},schoolContact:expect.any(Object)})}));
    expect(mocks.rpc).toHaveBeenCalledWith("complete_school_upload_job",{p_job_id:"job",p_lease_id:"lease"});
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.rpc.mock.invocationCallOrder[1]);
  });
  it("resumes a stored result without downloading or regenerating it",async()=>{
    mocks.rpc.mockImplementation(async(name:string)=>({data:name==="claim_school_upload_job"?{...base,prepared_report:{version:"2.1.0"}}:true,error:null}));
    await runSchoolUploadJob();expect(mocks.review).not.toHaveBeenCalled();expect(mocks.download).not.toHaveBeenCalled();
  });
  it("preserves teacher corrections and defers rate-limited work",async()=>{
    mocks.rpc.mockImplementation(async(name:string)=>({data:name==="claim_school_upload_job"?{...base,name_manual:true}:true,error:null}));
    await runSchoolUploadJob();expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("student_name");
    mocks.quota.mockResolvedValue({allowed:false,retryAfterSeconds:3600});mocks.review.mockClear();await runSchoolUploadJob();
    expect(mocks.rpc).toHaveBeenCalledWith("defer_school_upload_job",expect.objectContaining({p_seconds:3600}));expect(mocks.review).not.toHaveBeenCalled();
  });
  it("retains the checkpoint on a final save failure",async()=>{
    mocks.rpc.mockImplementation(async(name:string)=>({data:name==="claim_school_upload_job"?base:name==="complete_school_upload_job"?false:true,error:null}));
    await runSchoolUploadJob();expect(mocks.rpc.mock.calls.some(([name])=>name==="fail_school_upload_job")).toBe(false);
  });
});
