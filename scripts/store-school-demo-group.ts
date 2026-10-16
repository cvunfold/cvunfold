import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { saveAnalysis } from "../src/lib/data/store";
import { createAccessToken } from "../src/lib/security/tokens";
import { resolveReviewModel } from "../src/lib/ai/model-config";

async function main() {
  const reviewModel = resolveReviewModel();
  const schoolId = "745e1c96-605c-40fe-a5b6-0d58cc2a838f";
  const userId = "1d6ca6c1-cb28-4254-b091-6367d99f5af6";
  const url = process.env.SUPABASE_URL;
  if (!url || new URL(url).hostname !== "yttktyctjbciyqjpvunv.supabase.co" || process.env.MOCK_MODE !== "false") throw new Error("OWNERSHIP_MISMATCH");
  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const member = await db.from("school_members").select("school_id").eq("user_id", userId).single();
  if (member.error || member.data.school_id !== schoolId) throw new Error("MEMBERSHIP_MISMATCH");
  const files = await Promise.all(Array.from({ length: 10 }, (_, i) => readFile(`/private/tmp/cvunfold-school-demo-reviewed-${reviewModel}/demo-${i}.json`, "utf8").then(JSON.parse)));
  if (files.some(fixture => fixture.telemetry?.provenance?.model !== reviewModel || fixture.telemetry.provenance.fallbackUsed)) throw new Error("CACHE_PROVENANCE_MISMATCH");
  const groupName = "Frontend · 10 przykładów CV · 11.10.2026";
  let group = await db.from("school_groups").select("id").eq("school_id", schoolId).eq("name", groupName).maybeSingle();
  if (group.error) throw new Error("GROUP_READ_FAILED");
  if (!group.data) {
    group = await db.from("school_groups").insert({ school_id: schoolId, name: groupName, target_role: "frontend_developer", target_seniority: "first_job" }).select("id").single();
  }
  if (group.error || !group.data) throw new Error("GROUP_CREATE_FAILED");
  for (const fixture of files) {
    const existing = await db.from("analyses").select("id").eq("school_group_id", group.data.id).eq("school_student_name", fixture.name).maybeSingle();
    if (existing.error) throw new Error("ANALYSIS_READ_FAILED");
    if (existing.data) continue;
    const now = new Date();
    await saveAnalysis(createAccessToken(), { id: randomUUID(), createdAt: now, expiresAt: new Date(now.getTime() + 30 * 86400000), status: "complete", paid: false, plan: "full_review", locale: "pl", market: "pl", attribution: {}, report: { ...fixture.report, schoolContact: fixture.contact }, feedback: [], model: fixture.telemetry.model, inputTokens: fixture.telemetry.inputTokens, outputTokens: fixture.telemetry.outputTokens, estimatedAiCost: fixture.telemetry.estimatedCost, provenance: fixture.telemetry.provenance, documentKind: "pdf", schoolGroupId: group.data.id, schoolStudentName: fixture.name });
  }
  const check = await db.from("analyses").select("id,paid_at").eq("school_group_id", group.data.id);
  if (check.error || check.data.length !== 10 || check.data.some(row => row.paid_at)) throw new Error("GROUP_CHECK_FAILED");
  await writeFile("/private/tmp/cvunfold-school-demo-group.json", JSON.stringify({ groupId: group.data.id, count: check.data.length }), { mode: 0o600 });
  console.log(JSON.stringify({ groupId: group.data.id, count: check.data.length, paid: 0 }));
}
main().catch(error => { console.error(error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "GROUP_STORAGE_FAILED"); process.exitCode = 1; });
