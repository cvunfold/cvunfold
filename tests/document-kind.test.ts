import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("recording which document format was uploaded", () => {
  const migration = readFileSync("supabase/migrations/20260825090000_record_document_kind.sql", "utf8");
  const store = readFileSync("src/lib/data/store.ts", "utf8");
  const route = readFileSync("src/app/api/analyses/route.ts", "utf8");

  it("accepts only the two formats the uploader allows", () => {
    expect(migration).toContain("check (document_kind in ('pdf', 'docx'))");
  });

  it("leaves historical rows null instead of guessing them", () => {
    // Source files are deleted right after parsing, so the format of an older
    // analysis is genuinely unrecoverable. A backfill would only invent certainty.
    expect(migration).not.toMatch(/update\s+public\.analyses\s+set\s+document_kind/i);
    expect(migration).not.toContain("not null");
  });

  it("persists the value the parser already produced", () => {
    expect(route).toContain("documentKind = parsed.diagnostics.document_kind");
    expect(store).toContain("document_kind: analysis.documentKind ?? null");
  });

  it("records it on both parsing paths, so QA mode does not silently skip it", () => {
    expect(route.match(/documentKind = parsed\.diagnostics\.document_kind/g)).toHaveLength(2);
  });
});
