import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/schools/contact/route";
import { sendSchoolContact, schoolContactDeliveryEnabled } from "@/lib/schools/contact-mail";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { rateLimit } from "@/lib/security/rate-limit";

vi.mock("@/lib/schools/contact-mail", () => ({ sendSchoolContact: vi.fn(), schoolContactDeliveryEnabled: vi.fn() }));
vi.mock("@/lib/security/turnstile", () => ({ verifyTurnstile: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit: vi.fn() }));
const message = { name: "Test Mentor", email: "mentor@example.com", school: "Test school", message: "Please show the demo", requestId: "34a1e572-4e24-48c1-a654-a3d439745723", turnstileToken: "token" };
function request(body: unknown = message, origin = "https://cvunfold.com") {
  return new Request("https://cvunfold.com/api/schools/contact", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(rateLimit).mockReturnValue(true); vi.mocked(schoolContactDeliveryEnabled).mockReturnValue(true); vi.mocked(sendSchoolContact).mockResolvedValue(true); vi.mocked(verifyTurnstile).mockResolvedValue(); });

describe("public school contact", () => {
  it("accepts contact details without a message and includes the optional phone", async () => {
    const { message: omitted, ...details } = message;
    void omitted;
    expect((await POST(request({ ...details, phone: "+48 123 456 789" }))).status).toBe(200);
    expect(sendSchoolContact).toHaveBeenCalledWith(expect.objectContaining({ message: "", phone: "+48 123 456 789" }));
  });
  it("confirms success only after captcha and delivery succeed", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: true });
    expect(verifyTurnstile).toHaveBeenCalledWith("token", "local", "school_contact");
    expect(sendSchoolContact).toHaveBeenCalledWith(expect.objectContaining({ requestId: message.requestId }));
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it.each([
    { ...message, to: "attacker@example.com" },
    { ...message, website: "spam" },
    { ...message, email: "invalid" },
    { ...message, phone: "Call me\nHeader" },
    { ...message, school: "Header\nInjection" },
  ])("rejects forged recipients and invalid submissions", async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(sendSchoolContact).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests", async () => {
    expect((await POST(request(message, "https://attacker.example"))).status).toBe(403);
    expect(sendSchoolContact).not.toHaveBeenCalled();
  });
  it("bounds request size even without content-length", async () => {
    expect((await POST(request({ ...message, message: "x".repeat(13_000) }))).status).toBe(413);
    expect(sendSchoolContact).not.toHaveBeenCalled();
  });
  it("limits repeated attempts", async () => {
    vi.mocked(rateLimit).mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("600");
    expect(sendSchoolContact).not.toHaveBeenCalled();
  });
  it("does not claim success on delivery failure", async () => {
    vi.mocked(sendSchoolContact).mockResolvedValue(false);
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("sent");
  });
  it("does not deliver when captcha fails", async () => {
    vi.mocked(verifyTurnstile).mockRejectedValue(new Error("private provider detail"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("private provider detail");
    expect(sendSchoolContact).not.toHaveBeenCalled();
  });
});
