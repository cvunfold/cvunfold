import { describe, expect, it } from "vitest";
import { analysisPath } from "@/lib/i18n";
import { parseAttribution } from "@/lib/analytics/attribution";
import { safeAnalyticsPayload } from "@/lib/analytics/events";
import { parseSeniority } from "@/lib/rubrics/technical-v1";

describe("closed pre-scale measurement context", () => {
  it("builds a handoff URL from closed settings only", () => {
    expect(analysisPath("pl", {
      plan: "job_match",
      role: "mobile_developer",
      seniority: "lead",
      handoff: "mobile",
    })).toBe("/analiza?plan=job_match&role=mobile_developer&seniority=lead&handoff=mobile");
  });

  it("accepts closed attribution dimensions and fails closed on unknown fields", () => {
    expect(parseAttribution({ landing_variant: "developer", broad_role_enum: "devops_platform", selected_seniority_enum: "senior", handoff_origin: "other" }))
      .toEqual({ landing_variant: "developer", broad_role_enum: "devops_platform", selected_seniority_enum: "senior", handoff_origin: "other" });
    expect(parseAttribution({ landing_variant: "specialists", filename: "private.pdf" })).toEqual({});
  });

  it("rejects an unsupported seniority before rubric selection", () => {
    expect(parseSeniority("staff")).toBeNull();
    expect(parseSeniority("lead")).toBe("lead");
  });

  it("keeps upload and handoff analytics coarse", () => {
    expect(safeAnalyticsPayload("upload_started", {
      locale: "pl", market: "pl", plan: "full_review", landing_variant: "developer",
      broad_role_enum: "frontend_developer", selected_seniority_enum: "senior", upload_entrypoint: "picker",
      filename: "private.pdf", file_provider: "google_drive", report_token: "secret",
    }).properties).toEqual({
      locale: "pl", market: "pl", plan: "full_review", landing_variant: "developer",
      broad_role_enum: "frontend_developer", selected_seniority_enum: "senior", upload_entrypoint: "picker",
    });
    expect(safeAnalyticsPayload("desktop_handoff_completed", {
      locale: "en", market: "en", plan: "job_match", landing_variant: "developer", handoff_method: "clipboard", handoff_origin: "other",
      gclid: "secret", url: "https://example.test/private",
    }).properties).toEqual({ locale: "en", market: "en", plan: "job_match", landing_variant: "developer", handoff_method: "clipboard", handoff_origin: "other" });
  });
});
