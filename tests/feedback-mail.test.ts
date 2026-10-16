import { afterEach, describe, it, expect, vi } from "vitest";
const mocks=vi.hoisted(()=>({send:vi.fn()}));
vi.mock("resend",()=>({Resend:class{emails={send:mocks.send};}}));
import { sendFeedbackNotification } from "@/lib/feedback-mail";
afterEach(()=>{vi.clearAllMocks();vi.unstubAllEnvs();});
const message={requestId:"synthetic-feedback",source:"school" as const,locale:"pl",version:1,rating:3,accurate:"partly" as const,comment:"Uwagi były przydatne."};
describe("feedback owner notification",()=>{
 it("uses the school contact recipient and includes only feedback, with a stable retry key",async()=>{
  vi.stubEnv("RESEND_API_KEY","test-no-network");vi.stubEnv("SCHOOL_CONTACT_FROM","CVUnfold <test@example.com>");mocks.send.mockResolvedValue({data:{id:"mail-id"},error:null});
  expect(await sendFeedbackNotification({...message,analysisId:"private-root",accessToken:"private-token",report:{sensitive:"CV content"}} as typeof message)).toBe(true);
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({from:"CVUnfold <test@example.com>",to:["pawelmaczkaczarnecki@gmail.com"],subject:expect.stringContaining("3/5"),text:expect.stringContaining("Uwagi były przydatne.")}),{idempotencyKey:"report-feedback/synthetic-feedback"});
  const mail=JSON.stringify(mocks.send.mock.calls[0][0]);expect(mail).toContain("Częściowo");expect(mail).toContain("Wersja CV: 2");expect(mail).not.toMatch(/private-root|private-token|CV content/);
 });
 it("does not claim delivery on missing configuration, provider rejection or network failure",async()=>{
  vi.stubEnv("RESEND_API_KEY","");expect(await sendFeedbackNotification(message)).toBe(false);expect(mocks.send).not.toHaveBeenCalled();
  vi.stubEnv("RESEND_API_KEY","test-no-network");mocks.send.mockResolvedValue({data:null,error:{message:"provider error"}});expect(await sendFeedbackNotification(message)).toBe(false);
  mocks.send.mockRejectedValue(new Error("network unavailable"));expect(await sendFeedbackNotification(message)).toBe(false);
 });
});
