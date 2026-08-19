import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { parseDocument, detectTargetRole, rateLimit, validateUpload, validateSignature } = vi.hoisted(() => ({
  parseDocument: vi.fn(),
  detectTargetRole: vi.fn(),
  rateLimit: vi.fn(() => true),
  validateUpload: vi.fn(),
  validateSignature: vi.fn(),
}));

vi.mock("@/lib/document-parsing", () => ({ parseDocument }));
vi.mock("@/lib/role-detection", () => ({ detectTargetRole }));
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit }));
vi.mock("@/lib/security/upload", () => ({ validateUpload, validateSignature }));
vi.mock("@/lib/security/tokens", () => ({ hmacIdentifier: (value: string) => `hashed:${value}` }));

const { POST } = await import("@/app/api/detect-role/route");

function detectRequest(): Request {
  const body = new FormData();
  body.set("file", new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" }));
  return new Request("https://cvunfold.test/api/detect-role", { method: "POST", body });
}

beforeEach(() => {
  parseDocument.mockResolvedValue({ text: "Backend Developer, Spring Boot, Postgres." });
  detectTargetRole.mockReturnValue({ role: "backend_developer", confident: true, scores: [] });
  rateLimit.mockReturnValue(true);
});

afterEach(() => vi.clearAllMocks());

describe("POST /api/detect-role", () => {
  it("returns the detected role when the detector is confident", async () => {
    const response = await POST(detectRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ detected: true, role: "backend_developer" });
  });

  it("withholds a role the detector is not confident about", async () => {
    detectTargetRole.mockReturnValue({ role: "other", confident: false, scores: [] });
    expect(await (await POST(detectRequest())).json()).toEqual({ detected: false });
  });

  it("never leaks a parser failure as an error the visitor has to handle", async () => {
    parseDocument.mockRejectedValue(new Error("UNREADABLE_DOCUMENT"));
    const response = await POST(detectRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ detected: false });
  });

  it("applies the same upload validation as the analysis route", async () => {
    await POST(detectRequest());
    expect(validateUpload).toHaveBeenCalledOnce();
    expect(validateSignature).toHaveBeenCalledOnce();
  });

  it("rejects a rejected file before it reaches the parser", async () => {
    validateUpload.mockImplementation(() => { throw new Error("FILE_TOO_LARGE"); });
    expect(await (await POST(detectRequest())).json()).toEqual({ detected: false });
    expect(parseDocument).not.toHaveBeenCalled();
  });

  it("meters itself on a key that cannot eat into the analysis quota", async () => {
    await POST(detectRequest());
    expect(rateLimit).toHaveBeenCalledWith(expect.stringContaining("detect-role:"), 12, 60_000);
  });

  it("answers 429 without a role once the detection quota is spent", async () => {
    rateLimit.mockReturnValue(false);
    const response = await POST(detectRequest());
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ detected: false });
    expect(parseDocument).not.toHaveBeenCalled();
  });

  it("stores nothing: no document text reaches a response body", async () => {
    const body = await (await POST(detectRequest())).text();
    expect(body).not.toContain("Spring Boot");
  });
});
