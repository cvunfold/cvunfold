import { afterEach, describe, expect, it } from "vitest";
import { POST as createAnalysis } from "@/app/api/analyses/route";
import { getAnalysis } from "@/lib/data/store";

function analysisRequest(seniority: string, attribution: Record<string, string> = {}) {
  const form = new FormData();
  form.set("file", new File(["%PDF-1.7\nsynthetic"], "synthetic-cv.pdf", { type: "application/pdf" }));
  form.set("role", "frontend_developer");
  form.set("seniority", seniority);
  form.set("locale", "pl");
  form.set("jobDescription", "");
  form.set("attribution", JSON.stringify(attribution));
  return new Request("http://localhost/api/analyses", {
    method: "POST",
    headers: { "x-forwarded-for": `127.0.0.${seniority === "invalid" ? "21" : "22"}` },
    body: form,
  });
}

afterEach(() => {
  delete process.env.MOCK_MODE;
  delete process.env.TURNSTILE_SECRET_KEY;
});

describe("analysis attribution boundary", () => {
  it("rejects an open-ended target seniority", async () => {
    process.env.MOCK_MODE = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    const response = await createAnalysis(analysisRequest("invalid"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCategory: "invalid_target_seniority" });
  });

  it("stores only safe campaign data and server-owned funnel context", async () => {
    process.env.MOCK_MODE = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    const response = await createAnalysis(analysisRequest("senior", {
      source: "google",
      medium: "cpc",
      campaign: "cv_developer_pl_search",
      broad_role_enum: "backend_developer",
      selected_seniority_enum: "junior",
      landing_variant: "developer",
    }));
    expect(response.status).toBe(200);
    const result = await response.json() as { accessToken: string };
    const analysis = await getAnalysis(result.accessToken);
    expect(analysis?.attribution).toMatchObject({
      source: "google",
      medium: "cpc",
      campaign: "cv_developer_pl_search",
      broad_role_enum: "frontend_developer",
      selected_seniority_enum: "senior",
      landing_variant: "developer",
    });
    expect(analysis?.attribution).not.toHaveProperty("filename");
  });
});
