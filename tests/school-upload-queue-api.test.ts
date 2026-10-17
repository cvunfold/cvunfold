import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
const mocks=vi.hoisted(()=>({member:vi.fn(),prepare:vi.fn(),commit:vi.fn(),after:vi.fn()}));
vi.mock("next/server",async importOriginal=>({...await importOriginal<typeof import("next/server")>(),after:mocks.after}));
vi.mock("@/lib/schools/server",async importOriginal=>({...await importOriginal<typeof import("@/lib/schools/server")>(),requireSchool:mocks.member}));
vi.mock("@/lib/schools/upload-queue",()=>({schoolQueueEnabled:()=>true,createQueuedBatch:mocks.prepare,commitQueuedBatch:mocks.commit}));
vi.mock("@/lib/schools/upload-worker",()=>({processSchoolQueue:vi.fn()}));
vi.mock("@/lib/security/rate-limit",()=>({rateLimit:()=>true}));
import { POST } from "@/app/api/schools/uploads/route";
import { SchoolError } from "@/lib/schools/server";
const id="11111111-1111-4111-8111-111111111111";
const file={name:"CV.pdf",size:100,studentName:"Anna Testowa",manual:false};
const body={action:"prepare",groupId:id,requestId:id,consent:true,files:[file]};
const request=(data:unknown=body,origin="http://localhost")=>new Request("http://localhost/api/schools/uploads",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(data)});
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv("MOCK_MODE","false");vi.stubEnv("OPENAI_API_KEY","no-network-test");mocks.member.mockResolvedValue({schoolId:"school",userId:"user"});mocks.prepare.mockResolvedValue({batchId:id,jobs:[]});});
afterEach(()=>vi.unstubAllEnvs());
describe("school queue API boundary",()=>{
 it("requires same origin, school session and explicit consent",async()=>{
   expect((await POST(request(body,"https://foreign.test"))).status).toBe(403);expect(mocks.member).not.toHaveBeenCalled();
   mocks.member.mockRejectedValueOnce(new SchoolError(401,"Zaloguj się"));expect((await POST(request())).status).toBe(401);
   expect((await POST(request({...body,consent:false}))).status).toBe(400);expect(mocks.prepare).not.toHaveBeenCalled();
 });
 it("accepts 30 files and rejects 31, oversized files and batches",async()=>{
   expect((await POST(request({...body,files:Array(30).fill(file)}))).status).toBe(200);
   expect((await POST(request({...body,files:Array(31).fill(file)}))).status).toBe(400);
   expect((await POST(request({...body,files:[{...file,size:8*1024*1024+1}]}))).status).toBe(400);
   expect((await POST(request({...body,files:Array(30).fill({...file,size:8*1024*1024})}))).status).toBe(400);
 });
 it("commits only an owned batch before scheduling work",async()=>{
   mocks.commit.mockRejectedValueOnce(new SchoolError(404,"Nie znaleziono paczki"));
   expect((await POST(request({action:"commit",batchId:id}))).status).toBe(404);expect(mocks.after).not.toHaveBeenCalled();
   expect((await POST(request({action:"commit",batchId:id}))).status).toBe(200);expect(mocks.after).toHaveBeenCalledOnce();
 });
});
