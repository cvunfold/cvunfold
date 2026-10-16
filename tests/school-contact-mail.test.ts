import { afterEach, describe, expect, it, vi } from "vitest";
import { sendSchoolContact } from "@/lib/schools/contact-mail";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("school mail delivery", () => {
  it("uses a fixed owner recipient, reply-to and stable retry key", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    send.mockResolvedValue({ data: { id: "test-id" }, error: null });
    expect(await sendSchoolContact({ name: "Mentor", email: "mentor@example.com", school: "School", message: "Demo please", phone: "+48 123 456 789", website: "", turnstileToken: "", requestId: "test-request" })).toBe(true);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: ["pawelmaczkaczarnecki@gmail.com"], replyTo: "mentor@example.com", subject: "CVUnfold dla szkół: School" }), { idempotencyKey: "school-contact/test-request" });
  });
  it("does not treat provider errors as a successful send", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    send.mockResolvedValue({ data: null, error: { message: "failed" } });
    expect(await sendSchoolContact({ name: "Mentor", email: "mentor@example.com", school: "School", message: "Demo please", phone: "+48 123 456 789", website: "", turnstileToken: "", requestId: "test-request" })).toBe(false);
  });
});
