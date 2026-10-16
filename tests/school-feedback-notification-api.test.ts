import { beforeEach,afterEach,it,expect,vi } from "vitest";
const mocks=vi.hoisted(()=>({access:vi.fn(),versions:vi.fn(),save:vi.fn(),notify:vi.fn()}));
vi.mock("@/lib/schools/data",()=>({authorizedSchoolAnalysis:mocks.access}));
vi.mock("@/lib/schools/package",()=>({readSchoolPackage:async()=>({paid:true})}));
vi.mock("@/lib/schools/revisions",()=>({readSchoolVersions:mocks.versions}));
vi.mock("@/lib/schools/test-access",()=>({hasSchoolTestAccess:()=>false}));
vi.mock("@/lib/schools/server",async importOriginal=>({...await importOriginal<typeof import("@/lib/schools/server")>(),schoolDatabase:()=>({})}));
vi.mock("@/lib/data/feedback",async importOriginal=>({...await importOriginal<typeof import("@/lib/data/feedback")>(),insertFeedbackOnce:mocks.save}));
vi.mock("@/lib/feedback-mail",()=>({sendFeedbackNotification:mocks.notify}));
vi.mock("@/lib/security/rate-limit",()=>({rateLimit:()=>true}));
import { POST } from "@/app/api/schools/reports/[id]/feedback/route";
import { SchoolError } from "@/lib/schools/server";
const id=crypto.randomUUID(),requestId=crypto.randomUUID(),context={params:Promise.resolve({id})};
function request(){return new Request("http://localhost/api/schools/reports/"+id+"/feedback",{method:"POST",headers:{origin:"http://localhost","content-type":"application/json"},body:JSON.stringify({requestId,version:1,rating:3,accurate:"partly",comment:"Testowa uwaga"})});}
beforeEach(()=>{vi.clearAllMocks();mocks.access.mockResolvedValue({analysis:{id,paid:false},member:{userId:"user"},groupId:"group"});mocks.save.mockResolvedValue(undefined);mocks.notify.mockResolvedValue(true);});afterEach(()=>vi.restoreAllMocks());
it("saves the selected school version before notifying the same owner",async()=>{expect((await POST(request(),context)).status).toBe(200);expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({requestId,version:1,source:"school",rating:3}));expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.notify.mock.invocationCallOrder[0]);});
it("does not notify after an authorization or save failure",async()=>{mocks.access.mockRejectedValueOnce(new SchoolError(404,"Nie znaleziono"));expect((await POST(request(),context)).status).toBe(404);expect(mocks.notify).not.toHaveBeenCalled();mocks.save.mockRejectedValueOnce(new Error("SUPABASE_UPDATE_FAILED"));expect((await POST(request(),context)).status).toBe(503);expect(mocks.notify).not.toHaveBeenCalled();});
it("reports a notification failure instead of a successful submission",async()=>{mocks.notify.mockResolvedValue(false);const response=await POST(request(),context);expect(response.status).toBe(503);expect((await response.json()).error).toContain("Ocena została zapisana");});
