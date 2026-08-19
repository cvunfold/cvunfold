import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  anonymousRoleCategories,
  classifyAnonymousRole,
  classifyAnonymousSource,
  summarizeAnonymousRoleStatistics,
} from "@/lib/analytics/anonymous-role-statistics";

const migration = readFileSync(new URL("../supabase/migrations/20260814112020_anonymous_role_statistics.sql", import.meta.url), "utf8");
const permissionFix = readFileSync(new URL("../supabase/migrations/20260814153118_grant_anonymous_role_trigger_permissions.sql", import.meta.url), "utf8");
const triggerFix = readFileSync(new URL("../supabase/migrations/20260814153226_fix_anonymous_role_trigger_variable_conflict.sql", import.meta.url), "utf8");
const categoryExpansion = readFileSync(new URL("../supabase/migrations/20260819130000_expand_anonymous_role_categories.sql", import.meta.url), "utf8");
const tableDefinition = migration.match(/create table if not exists public\.anonymous_role_aggregates \(([\s\S]*?)\n\);/)?.[1] || "";

describe("anonymous role statistics", () => {
  it("maps free-form model output to a closed audience category", () => {
    expect(classifyAnonymousRole("Senior Frontend Developer")).toBe("supported_it");
    expect(classifyAnonymousRole("Programistka Java")).toBe("supported_it");
    expect(classifyAnonymousRole("QA / Test Automation Engineer")).toBe("supported_it");
    expect(classifyAnonymousRole("DevOps / Platform Engineer")).toBe("supported_it");
    expect(classifyAnonymousRole("Data Engineer")).toBe("other_it");
    expect(classifyAnonymousRole("Product Manager")).toBe("other_it");
    expect(classifyAnonymousRole("Unable to determine from the CV")).toBe("unclear");
    expect(classifyAnonymousRole("Engineer")).toBe("unclear");
  });

  it("maps common off-target professions to a specific non-IT category instead of one catch-all", () => {
    expect(classifyAnonymousRole("Business Developer")).toBe("sales_marketing");
    expect(classifyAnonymousRole("Accountant")).toBe("finance_accounting");
    expect(classifyAnonymousRole("Architekt")).toBe("architecture_construction");
    expect(classifyAnonymousRole("Solutions Architect")).toBe("other_it");
    expect(classifyAnonymousRole("Lekarz rodzinny")).toBe("healthcare_medical");
    expect(classifyAnonymousRole("Adwokat")).toBe("legal");
    expect(classifyAnonymousRole("Nauczycielka matematyki")).toBe("education_academia");
    expect(classifyAnonymousRole("Sales Representative")).toBe("sales_marketing");
    expect(classifyAnonymousRole("HR Business Partner")).toBe("hr_recruiting");
    expect(classifyAnonymousRole("Policjant")).toBe("public_sector");
    expect(classifyAnonymousRole("Chef")).toBe("hospitality_retail");
    expect(classifyAnonymousRole("Graphic Designer")).toBe("creative_arts_media");
    expect(classifyAnonymousRole("Inżynier budownictwa")).toBe("engineering_manufacturing_nonit");
    expect(classifyAnonymousRole("Elektryk")).toBe("skilled_trades");
    expect(classifyAnonymousRole("Biolog")).toBe("science_research_nonit");
    expect(classifyAnonymousRole("Kapitan żeglugi wielkiej")).toBe("other_non_it");
  });

  it("keeps acquisition attribution deliberately coarse", () => {
    expect(classifyAnonymousSource({ source: "google", medium: "cpc" })).toBe("google_cpc");
    expect(classifyAnonymousSource({ handoff_origin: "google_cpc" })).toBe("google_cpc");
    expect(classifyAnonymousSource({ source: "newsletter", medium: "email", campaign: "private-detail" })).toBe("other");
  });

  it("suppresses role cells smaller than five analyses", () => {
    const summary = summarizeAnonymousRoleStatistics([
      { source_bucket: "google_cpc", role_category: "supported_it", analysis_count: 5 },
      { source_bucket: "google_cpc", role_category: "other_non_it", analysis_count: 2 },
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

  it("keeps the private trigger callable by the server role without ambiguous variable names", () => {
    expect(permissionFix).toContain("grant usage on schema private to service_role");
    expect(permissionFix).toContain("grant execute on function private.classify_anonymous_perceived_role(text) to service_role");
    expect(triggerFix).toContain("v_role_category text");
    expect(triggerFix).toContain("v_source_bucket text");
    expect(triggerFix).toContain("values (v_role_category, v_source_bucket, 1)");
    expect(triggerFix).not.toContain("grant execute on function private.classify_anonymous_perceived_role(text) to anon");
  });

  it("keeps the database check constraint in lockstep with the TypeScript category list", () => {
    // The two classifiers are maintained by hand in separate languages; this is the guard
    // against them silently drifting apart.
    const constraintClause = categoryExpansion.match(/add constraint anonymous_role_aggregates_role_category_check\s*\n\s*check \(role_category in \(([\s\S]*?)\)\);/)?.[1] || "";
    expect(constraintClause).not.toBe("");
    for (const category of anonymousRoleCategories) expect(constraintClause).toContain(`'${category}'`);
    expect(constraintClause).not.toContain("'non_it'");

    // The old non_it rows must be reassigned, not left to violate the new constraint.
    expect(categoryExpansion).toContain("delete from public.anonymous_role_aggregates where role_category = 'non_it'");
  });
});
