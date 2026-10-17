export type SchoolUploadJob = { id: string; name: string; status: "uploading" | "queued" | "processing" | "complete" | "failed"; error?: string; notBefore?: string; startedAt?: string; analysisId?: string };
export type SchoolUploadBatch = { id: string; status: "uploading" | "queued" | "processing" | "complete"; createdAt: string; jobs: SchoolUploadJob[] };
export type SchoolAnalysisTiming = { averageMs: number; sampleCount: number };
export const INITIAL_ANALYSIS_MS = 120_000;
export function estimateSchoolReady(jobs: SchoolUploadJob[], timing: SchoolAnalysisTiming, now = Date.now()) {
  const average = Math.max(1000, timing.averageMs || INITIAL_ANALYSIS_MS);
  const queued = jobs.filter(j => j.status === "queued").length;
  const running = jobs.filter(j => j.status === "processing");
  const wait = Math.max(0, ...jobs.filter(j => j.status === "queued").map(j => Date.parse(j.notBefore || "") - now).filter(Number.isFinite));
  const remainingMs = wait + queued * (average + 30_000) + running.reduce((total,j) => total + Math.max(15_000, average - (now - new Date(j.startedAt || now).getTime())), 0);
  return { remainingMs, readyAt: now + remainingMs, completed: jobs.filter(j => j.status === "complete").length, failed: jobs.filter(j => j.status === "failed").length, remaining: queued + running.length };
}
