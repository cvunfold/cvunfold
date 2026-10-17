import { afterEach,beforeEach,describe,it,expect,vi } from "vitest";
const mocks=vi.hoisted(()=>({notify:vi.fn()}));
vi.mock("@/lib/feedback-mail",()=>({sendFeedbackNotification:mocks.notify}));
import { POST } from "@/app/api/report/feedback/route";
import { createMockReport } from "@/lib/ai/mock-report";
import { saveAnalysis,getAnalysis } from "@/lib/data/store";
import { createAccessToken } from "@/lib/security/tokens";
import { REPORT_SESSION_COOKIE } from "@/lib/security/report-session";
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("MOCK_MODE","true");vi.stubEnv("SUPABASE_URL","");mocks.notify.mockResolvedValue(true);});afterEach(()=>vi.unstubAllEnvs());
async function fixture(paid=true){const token=createAccessToken(),id=crypto.randomUUID();await saveAnalysis(token,{id,createdAt:new Date(),expiresAt:new Date(Date.now()+86400000),status:"complete",paid,plan:"full_review",locale:"pl",market:"pl",attribution:{},report:createMockReport(),feedback:[]});return {token,id};}
function request(token:string,requestId=crypto.randomUUID()){return new Request("http://localhost/api/report/feedback",{method:"POST",headers:{origin:"http://localhost",cookie:`${REPORT_SESSION_COOKIE}=${token}`,"content-type":"application/json"},body:JSON.stringify({requestId,rating:4,accurate:"partly",comment:"Testowa uwaga"})});}
describe("feedback save and owner delivery",()=>{
 it("reports a delivery failure, then safely retries without duplicating the saved rating",async()=>{
  const f=await fixture(),requestId=crypto.randomUUID();mocks.notify.mockResolvedValueOnce(false);
  const failed=await POST(request(f.token,requestId));expect(failed.status).toBe(503);expect(await failed.json()).toMatchObject({saved:true,error:"FEEDBACK_NOTIFICATION_FAILED"});
  expect((await getAnalysis(f.token))!.feedback).toHaveLength(1);
  const retried=await POST(request(f.token,requestId));expect(retried.status).toBe(200);expect(await retried.json()).toMatchObject({sent:true});expect((await getAnalysis(f.token))!.feedback).toHaveLength(1);
  expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({requestId,rating:4,accurate:"partly",source:"individual",comment:"Testowa uwaga"}));
 });
 it("rejects a foreign Origin before saving or notifying",async()=>{
  const f=await fixture(),foreign=request(f.token);foreign.headers.set("origin","https://foreign.invalid");
  expect((await POST(foreign)).status).toBe(403);expect((await getAnalysis(f.token))!.feedback).toHaveLength(0);expect(mocks.notify).not.toHaveBeenCalled();
 });
 it("does not notify for an anonymous or locked report",async()=>{
  expect((await POST(request(""))).status).toBe(401);const f=await fixture(false);expect((await POST(request(f.token))).status).toBe(403);expect(mocks.notify).not.toHaveBeenCalled();
 });
});
