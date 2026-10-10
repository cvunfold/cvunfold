import type { Seniority } from "@/lib/rubrics/technical-v1";

type DetectedStage = Exclude<Seniority, "auto">;
export type SeniorityDetection = { seniority: DetectedStage | null; declaredYears: number | null };

// Conservative prefill of the declared profile, not an assessment of the person.
// Inspect the heading/profile before work history: historical titles, colleagues
// and technology versions must never pick the target stage. Years corroborate a
// declared title; they never promote someone to Senior or Lead by themselves.
export function detectSeniority(text: string): SeniorityDetection {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").toLowerCase();
  const heading = normalized.split(/\r?\n/).filter(line => line.trim()).slice(0, 12);
  const profile: string[] = [];
  for (const line of heading) {
    if (/^\s*(?:doswiadczenie(?: zawodowe)?|experience|work experience|employment|projekty|projects|education|edukacja)\s*[:|]?\s*$/.test(line)) break;
    profile.push(line.trim());
  }
  const years = profile.join(" ").match(/\b(\d{1,2})(?:\+)?\s*(?:lat(?:a)?(?:\s+komercyjnego)?\s+doswiadczenia|years?(?:\s+of)?(?:\s+commercial)?\s+experience)\b/);
  const declaredYears = years ? Number(years[1]) : null;
  const stages = new Set<DetectedStage>();
  const role = "(?:[a-z0-9+#. /-]+ )?(?:developer|engineer|programista|programistka|tester|specialist|designer|analyst|consultant)";
  for (const line of profile) {
    if (/^(?:szukam|poszukuje|looking for|seeking|cel[: ]).*?(?:pierwsz[a-z]* prac[a-z]*|first (?:job|role))/.test(line)) stages.add("first_job");
    if (/^(?:tech lead|technical lead|team lead)\s*$/.test(line)) stages.add("lead");
    const title = line.match(new RegExp("^(junior|mid|middle|regular|senior|lead|tech lead|technical lead) " + role + "(?:\\b|$)"));
    const titleStages: Record<string, DetectedStage> = { junior: "junior", mid: "mid", middle: "mid", regular: "mid", senior: "senior", lead: "lead", "tech lead": "lead", "technical lead": "lead" };
    if (title) stages.add(titleStages[title[1]]);
  }
  // An explicit first-job goal outweighs a Junior profile heading. Other
  // conflicting declarations leave the field empty rather than guessing.
  if (stages.has("first_job") && [...stages].every(stage => stage === "first_job" || stage === "junior")) return { seniority: "first_job", declaredYears };
  const seniority = stages.size === 1 ? [...stages][0] : null;
  // A strongly contradictory declaration calls for the visitor's own choice.
  if (seniority === "senior" && declaredYears !== null && declaredYears < 2) return { seniority: null, declaredYears };
  return { seniority, declaredYears };
}
