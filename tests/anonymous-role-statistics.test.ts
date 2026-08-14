import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  classifyAnonymousRole,
  classifyAnonymousSource,
  summarizeAnonymousRoleStatistics,
} from "@/lib/analytics/anonymous-role-statistics";

const migration = readFileSync(new URL("../supabase/migrations/20260814101608_anonymous_role_statistics.sql", import.meta.url), "utf8");
const tableDefinition = migration.match(/create table if not exists public\.anonymous_role_aggregates \(([\s\S]*?)\n\);/)?.[1] || "";

describe("anonymous role statistics", () => {
  it("maps free-form model output to a closed audience category", () => {
    expect(classifyAnonymousRole("Senior Frontend Developer")).toBe("supported_it");
    expect(classifyAnonymousRole("Programistka Java")).toBe("supported_it");
    expect(classifyAnonymousRole("QA / Test Automation Engineer")).toBe("supported_it");
    expect(classifyAnonymousRole("DevOps / Platform Engineer")).toBe("supported_it");
    expect(classifyAnonymousRole("Data Engineer")).toBe("other_it");
    expect(classifyAnonymousRole("Product Manager")).toBe("other_it");
    expect(classifyAnonymousRole("Business Developer")).toBe("non_it");
    expect(classifyAnonymousRole("Accountant")).toBe("non_it");
    expect(classifyAnonymousRole("Unable to determine from the CV")).toBe("unclear");
    expect(classifyAnonymousRole("Engineer")).toBe("unclear");
  });

  it("keeps acquisition attribution deliberately coarse", () => {
    expect(classifyAnonymousSource({ source: "google", medium: "cpc" })).toBe("google_cpc");
    expect(classifyAnonymousSource({ handoff_origin: "google_cpc" })).toBe("google_cpc");
    expect(classifyAnonymousSource({ source: "newsletter", medium: "email", campaign: "private-detail" })).toBe("other");
  });

  it("suppresses role cells smaller than five analyses", () => {
    const summary = summarizeAnonymousRoleStatistics([
      { source_bucket: "google_cpc", role_category: "supported_it", analysis_count: 5 },
      { source_bucket: "google_cpc", role_category: "non_it", analysis_count: 2 },
      { source_bucket: "other", role_category: "other_it", analysis_count: 4 },
    ]);
    expect(summary.total).toBe(11);
    expect(summary.bySource.google_cpc.roles.counts).toEqual({ supported_it: 5 });
    expect(summary.bySource.google_cpc.roles.suppressed).toBe(2);
    expect(summary.bySource.other.roles.counts).toEqual({});
    expect(summary.bySource.other.roles.suppressed).toBe(4);
  });

  it("stores no individual-level dimensions and keeps the table server-only", () => {
    expect(tableDefinition).toContain("role_category text");
    expect(tableDefinition).toContain("source_bucket text");
    expect(tableDefinition).toContain("analysis_count bigint");
    expect(tableDefinition).not.toMatch(/analysis_id|report_id|perceived_role|created_at|updated_at|timestamp|locale|utm|click|ip_address|cv_content|report_content/);

    expect(migration).toContain("alter table public.anonymous_role_aggregates enable row level security");
    expect(migration).toContain("revoke all on table public.anonymous_role_aggregates from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, update on table public.anonymous_role_aggregates to service_role");
    expect(migration).toContain("after insert on public.reports");
    expect(migration).not.toContain("grant select on table public.anonymous_role_aggregates to anon");
  });
});
