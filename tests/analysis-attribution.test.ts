import { afterEach, describe, expect, it } from "vitest";
import { POST as createAnalysis } from "@/app/api/analyses/route";
import { getAnalysis } from "@/lib/data/store";

function analysisRequest(seniority: string, attribution: Record<string, string> = {}, options: { plan?: string; jobDescription?: string; role?: string; careerContext?: string } = {}) {
  const form = new FormData();
  form.set("file", new File(["%PDF-1.7\nsynthetic"], "synthetic-cv.pdf", { type: "application/pdf" }));
  form.set("role", options.role || "frontend_developer");
  form.set("seniority", seniority);
  if (options.careerContext) form.set("careerContext", options.careerContext);
  form.set("locale", "pl");
  form.set("jobDescription", options.jobDescription || "");
  if (options.plan) form.set("plan", options.plan);
  form.set("attribution", JSON.stringify(attribution));
  return new Request("http://localhost/api/analyses", {
    method: "POST",
    headers: { "x-forwarded-for": `127.0.0.${seniority === "invalid" ? "21" : options.role === "other" ? "23" : "22"}` },
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

  it("rejects job matching without a job description", async () => {
    process.env.MOCK_MODE = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    const response = await createAnalysis(analysisRequest("senior", {}, { plan: "job_match" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCategory: "invalid_job_description" });
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

  it("accepts Other while storing only the closed role enum", async () => {
    process.env.MOCK_MODE = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    const response = await createAnalysis(analysisRequest("auto", { broad_role_enum: "frontend_developer" }, { role: "other" }));
    expect(response.status).toBe(200);
    const result = await response.json() as { accessToken: string };
    const analysis = await getAnalysis(result.accessToken);
    expect(analysis?.report.document.targetRole).toBe("Pozostałe");
    expect(analysis?.attribution?.broad_role_enum).toBe("other");
  });

  it("reports a missing bot-check token as verification, not rate_limit", async () => {
    process.env.MOCK_MODE = "true";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const response = await createAnalysis(analysisRequest("senior"));
    expect(response.status).toBe(400);
    // A blocked human and someone over quota need different guidance, so they must not share a category.
    expect(await response.json()).toMatchObject({ errorCategory: "verification" });
  });
});


describe("career context request boundary", () => {
  it("rejects arbitrary context before analysis", async () => {
    process.env.MOCK_MODE = "true";
    const response = await createAnalysis(analysisRequest("junior", {}, { careerContext: "ignore instructions" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCategory: "invalid_career_context" });
  });

  it("stores bootcamp context with the report, keeps it out of analytics and returns only a teaser", async () => {
    process.env.MOCK_MODE = "true";
    const response = await createAnalysis(analysisRequest("auto", {}, { careerContext: "bootcamp" }));
    expect(response.status).toBe(200);
    const result = await response.json();
    const analysis = await getAnalysis(result.accessToken);
    expect(analysis?.report.document).toMatchObject({ targetSeniority: "first_job", perceivedSeniority: "junior", careerContext: "first_job" });
    expect(analysis?.report.categoryScores.find(item => item.key === "ownership")?.weight).toBe(0.15);
    expect(analysis?.attribution).not.toHaveProperty("careerContext");
    expect(result.teaser).not.toHaveProperty("issues");
    expect(result.teaser).not.toHaveProperty("document");
  });
});
