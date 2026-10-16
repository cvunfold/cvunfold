import { z } from "zod";
import type { SavedSchoolAnswer } from "@/lib/schools/revision-context";

const prefix = "cvunfold:school-answers:v1:";
const record = z.object({
  version: z.number().int().min(0), method: z.string().max(4000), savedAt: z.string().datetime(),
  question: z.object({ id: z.string().max(120), title: z.string().max(1000), question: z.string().max(1500), instruction: z.string().max(4000) }),
  category: z.string().max(40), diagnosticKind: z.string().max(80), anchors: z.array(z.string().max(20)).max(100),
  answer: z.object({ status: z.enum(["confirmed", "not_done", "unknown", "skipped"]), text: z.string().max(1500) }),
});
const envelope = z.object({ analysisId: z.string().max(120), expiresAt: z.string(), records: z.array(record).max(20) });

export function readSchoolAnswerHistory(scope: string, analysisId: string): SavedSchoolAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const value = sessionStorage.getItem(prefix + scope);
    if (!value) return [];
    const parsed = envelope.safeParse(JSON.parse(value));
    if (!parsed.success || !(Date.parse(parsed.data.expiresAt) > Date.now())) {
      sessionStorage.removeItem(prefix + scope); return [];
    }
    if (parsed.data.analysisId !== analysisId) return [];
    return parsed.data.records;
  } catch { return []; }
}

export function writeSchoolAnswerHistory(scope: string, analysisId: string, expiresAt: string, records: SavedSchoolAnswer[]): void {
  if (!(Date.parse(expiresAt) > Date.now())) throw new Error("Raport wygasł. Nie zapisano odpowiedzi.");
  const value = envelope.parse({ analysisId, expiresAt, records });
  sessionStorage.setItem(prefix + scope, JSON.stringify(value));
}

export function clearSchoolAnswerHistory(analysisId?: string): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith(prefix)) continue;
      if (!analysisId || JSON.parse(sessionStorage.getItem(key) || "{}").analysisId === analysisId) sessionStorage.removeItem(key);
    }
  } catch { /* Storage may be unavailable; never leak its contents to logs. */ }
}
