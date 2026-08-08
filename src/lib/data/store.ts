import type { CVReport } from "@/lib/ai/schemas/report";
import { hashToken } from "@/lib/security/tokens";

export type Analysis = {
  id: string; createdAt: Date; expiresAt: Date; tokenHash: string; status: "complete" | "deleted";
  paid: boolean; plan: "full_review" | "job_match"; report: CVReport; feedback: Array<{ rating: number; accurate: string; issueId?: string; comment?: string }>;
};

type Store = { analyses: Map<string, Analysis>; events: Array<{ name: string; at: Date }> };
const globalStore = globalThis as typeof globalThis & { __cvunfold?: Store };
const store: Store = globalStore.__cvunfold ?? { analyses: new Map(), events: [] };
globalStore.__cvunfold = store;

export function saveAnalysis(token: string, analysis: Omit<Analysis, "tokenHash">): void { store.analyses.set(hashToken(token), { ...analysis, tokenHash: hashToken(token) }); }
export function getAnalysis(token: string): Analysis | undefined {
  const item = store.analyses.get(hashToken(token));
  if (!item || item.status === "deleted" || item.expiresAt < new Date()) return undefined;
  return item;
}
export function updateAnalysis(token: string, fn: (item: Analysis) => void): Analysis | undefined { const item = getAnalysis(token); if (item) fn(item); return item; }
export function deleteAnalysis(token: string): boolean { const item = getAnalysis(token); if (!item) return false; item.status = "deleted"; item.report = {} as CVReport; return true; }
export function cleanupExpired(now = new Date()): number { let count = 0; for (const item of store.analyses.values()) if (item.expiresAt <= now) { item.status = "deleted"; item.report = {} as CVReport; count += 1; } return count; }
export function track(name: string): void { store.events.push({ name, at: new Date() }); }
export function diagnostics() {
  const values = [...store.analyses.values()];
  return { analyses: values.length, completed: values.filter((v) => v.status === "complete").length, paid: values.filter((v) => v.paid).length,
    deleted: values.filter((v) => v.status === "deleted").length, feedback: values.reduce((sum, v) => sum + v.feedback.length, 0),
    events: Object.fromEntries([...new Set(store.events.map((e) => e.name))].map((name) => [name, store.events.filter((e) => e.name === name).length])) };
}
