import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260811203319_feedback_quality_aggregates.sql", import.meta.url), "utf8");
const tableDefinition = migration.match(/create table if not exists public\.feedback_quality_aggregates \(([\s\S]*?)\n\);/)?.[1] || "";
const notesMigration = readFileSync(new URL("../supabase/migrations/20260818140000_retained_feedback_notes.sql", import.meta.url), "utf8");
const notesTableDefinition = notesMigration.match(/create table if not exists public\.feedback_notes \(([\s\S]*?)\n\);/)?.[1] || "";

describe("feedback quality retention", () => {
  it("stores only non-identifying aggregate dimensions and counts", () => {
    expect(tableDefinition).toContain("locale text");
    expect(tableDefinition).toContain("prompt_version text");
    expect(tableDefinition).toContain("rubric_version text");
    expect(tableDefinition).toContain("review_model text");
    expect(tableDefinition).toContain("rating smallint");
    expect(tableDefinition).toContain("accurate text");
    expect(tableDefinition).toContain("response_count bigint");

    expect(tableDefinition).not.toMatch(/analysis_id|comment|issue_id|target_role|created_at|cv_content|report_content/);
  });

  it("aggregates on insert without weakening row-level access", () => {
    expect(migration).toContain("alter table public.feedback_quality_aggregates enable row level security");
    expect(migration).toContain("revoke all on table public.feedback_quality_aggregates from anon, authenticated");
    expect(migration).toContain("after insert on public.feedback");
    expect(migration).not.toContain("grant select on table public.feedback_quality_aggregates to anon");
  });

  it("retains useful written feedback for a bounded period without report linkage", () => {
    expect(notesTableDefinition).toContain("comment text not null");
    expect(notesTableDefinition).toContain("expires_at timestamptz not null");
    expect(notesTableDefinition).toContain("interval '90 days'");
    expect(notesTableDefinition).not.toMatch(/analysis_id|issue_id|cv_content|report_content/);
    expect(notesMigration).toContain("alter table public.feedback_notes enable row level security");
    expect(notesMigration).toContain("revoke all on table public.feedback_notes from anon, authenticated");
    expect(notesMigration).toContain("after insert on public.feedback");
    expect(notesMigration).toContain("delete from public.feedback_notes where expires_at <= p_now");
  });
});
