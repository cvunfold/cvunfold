import type { CVReport, EvidenceMap, ModelReport, TeaserReport } from "./schemas/report";
import { reportSchema } from "./schemas/report";
import type { RubricCategory } from "@/lib/rubrics/technical-v1";
import { normalizeCategoryEvidence, normalizeDiagnosticKind, prioritizeFirstJobIssues, alignNextSteps } from "./report-policy";
import { normalizeIssueAction } from "./issue-action";
import { normalizeReportRecommendations } from "./report-recommendations";
import { getScoreThresholds } from "@/lib/rubrics/score-scale";

export function calculateOverall(categories: ModelReport["categoryScores"]): number {
  const weight = categories.reduce((sum, category) => sum + category.weight, 0);
  if (Math.abs(weight - 1) > 0.001) throw new Error("INVALID_RUBRIC_WEIGHTS");
  return Math.round(categories.reduce((sum, category) => sum + category.score * category.weight, 0));
}

export function applyServerRubric(report: ModelReport, rubric: RubricCategory[]): ModelReport {
  const modelCategories = new Map(report.categoryScores.map((category) => [category.key, category]));
  const categoryScores = rubric.map((category) => {
    const modelCategory = modelCategories.get(category.key);
    if (!modelCategory) return {
      ...category,
      score: 0,
      rationale: "Model nie zwrócił oceny tej kategorii.",
      evidenceRefs: [],
    };
    return {
      ...modelCategory,
      key: category.key,
      label: category.label,
      weight: category.weight,
    };
  });
  return { ...report, categoryScores };
}

const numberPattern = /\b\d+(?:[.,]\d+)?%?\b/g;
const technicalTokenPattern = /\b(?:React|Next(?:\.js)?|TypeScript|JavaScript|Node(?:\.js)?|Python|Java|Kotlin|Swift|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|PostgreSQL|MySQL|Redis|Kafka|Terraform|CI\/CD|Web\sVitals|LCP|API|RFC)\b/gi;
const fillInPlaceholderPattern = /\[[^\]]+\]|<[^>]+>|\b(?:TBD|TODO)\b/gi;
const rewriteStopwords = new Set([
  "and", "the", "for", "with", "from", "that", "this", "into", "oraz", "dla", "przy", "nad", "pod", "który", "która", "które", "jest", "było", "była", "with",
]);
// Words about repositioning existing evidence, not about facts. An EXPOSE
// necessarily writes new connective language when it moves a fact into a
// different sentence or section — "warto wyeksponować obok najnowszej roli"
// contains zero new claims, but every one of those words is absent from the
// cited evidence. Without this list, novelty counts framing prose as
// fabrication precisely where EXPOSE is supposed to add it.
const repositioningStopwords = new Set([
  "warto", "eksponować", "wyeksponować", "eksponuj", "wyeksponuj", "podkreślić", "podkreśl",
  "przenieś", "przenieść", "przesunąć", "przesuń", "wcześniej", "wyżej", "obok", "bliżej",
  "kluczowy", "kluczowe", "kluczowa", "najważniejszy", "najważniejsze", "najważniejsza",
  "najmocniejszy", "najmocniejsze", "najmocniejsza",
  "doświadczenie", "doświadczenia", "doświadczeniu", "doświadczeniem",
  "osiągnięcie", "osiągnięcia", "osiągnięte", "osiągnięty",
  "podsumowanie", "podsumowaniu", "podsumowania", "sekcja", "sekcji", "sekcję",
  "dowód", "dowody", "dowodów", "dokument", "dokumencie", "dokumentu",
  "wraz", "także", "również", "seniority", "redukcja", "redukcji",
  // Vocabulary the rc4 attribution rule itself asks the model to write when it
  // moves a fact and names where it came from — "role" is a structural word,
  // not a claim, and "preserving attribution" describes complying with the
  // rule, not a new fact about the candidate.
  "zachować", "zachowując", "zachowuje", "przypisanie", "przypisać", "przypisania",
  "rola", "roli", "rolę",
  "surface", "highlight", "highlighting", "worth", "move", "moved", "moving", "earlier", "above", "near", "closer",
  "key", "important", "summary", "achieved", "achievement", "achievements", "experience", "section",
  "evidence", "document", "strongest", "reduction", "also", "role", "preserve", "preserving", "attribution",
]);

// A Polish inflected form (zmniejszenie/zmniejszyła, ograniczenie/ograniczyła,
// najnowszego/najnowsza) shares almost none of its exact spelling with the verb
// or adjective form actually cited, even though it names the identical fact.
// English barely inflects, so this prefix approximation is nearly a no-op there
// and only does real work for Polish.
function stem(token: string): string {
  return token.slice(0, Math.min(token.length, 6));
}

function unsupportedFacts(proposed: string, sources: string[]): boolean {
  const source = sources.join(" ").toLocaleLowerCase("en");
  if ((proposed.match(fillInPlaceholderPattern) || []).some((candidate) => !source.includes(candidate.toLocaleLowerCase("en")))) return true;
  const candidates = [
    ...(proposed.match(numberPattern) || []),
    ...(proposed.match(technicalTokenPattern) || []),
  ];
  return candidates.some((candidate) => !source.includes(candidate.toLocaleLowerCase("en")));
}

function excessiveSemanticNovelty(proposed: string, sources: string[]): boolean {
  const tokens = (value: string) => new Set((value.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu) || [])
    .filter((token) => token.length >= 4 && !rewriteStopwords.has(token) && !repositioningStopwords.has(token)));
  const sourceTokens = tokens(sources.join(" "));
  const sourceStems = new Set([...sourceTokens].map(stem));
  const proposedTokens = [...tokens(proposed)];
  return proposedTokens.filter((token) => !sourceTokens.has(token) && !sourceStems.has(stem(token))).length > 2;
}

export type CalibrationViolation = { category: string; score: number; severity: "important" | "critical"; cap: number };

// Current assessments apply severity caps before report writing. The audit
// verifies the final report and also handles historical model-scored reports
// using their original rubric boundaries. It reports any breach without repair.
export function auditCalibration(report: Pick<CVReport, "categoryScores" | "issues"> & Partial<Pick<CVReport, "rubricVersion">>): CalibrationViolation[] {
  const thresholds = getScoreThresholds(report.rubricVersion);
  const scores = new Map(report.categoryScores.map((category) => [category.key, category.score]));
  const strictest = new Map<string, "important" | "critical">();
  for (const issue of report.issues) {
    if (issue.severity === "minor") continue;
    if (strictest.get(issue.category) !== "critical") strictest.set(issue.category, issue.severity);
  }
  return [...strictest].flatMap(([category, severity]) => {
    const score = scores.get(category);
    const cap = severity === "critical" ? thresholds.criticalCap : thresholds.importantCap;
    return score !== undefined && score > cap ? [{ category, score, severity, cap }] : [];
  });
}

export function validateEvidence(report: ModelReport, validRefs: Set<string>, evidence: EvidenceMap = {}, options: { diagnosticsLocked?: boolean } = {}): CVReport {
  const parsed = reportSchema.parse(report);
  const keep = (refs: string[]) => [...new Set(refs.filter((ref) => validRefs.has(ref)))];
  const categoryScores = parsed.categoryScores.map(category => normalizeCategoryEvidence(category, validRefs, parsed.locale));
  const strengths = parsed.strengths.filter((item) => keep(item.evidenceRefs).length > 0).map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  let issues = parsed.issues.filter((item) => item.suggestion?.type === "gap" || item.suggestion?.type === "question" || keep(item.evidenceRefs).length > 0)
    .map((item) => {
      // A GAP describes missing visible evidence. A model may cite the line that
      // admits the omission, but retaining that ref makes the gap look like a
      // supported claim. Keep the boundary deterministic on the server.
      const evidenceRefs = item.suggestion?.type === "gap" ? [] : keep(item.evidenceRefs);
      // Grounded against the whole CV, not just this issue's own evidenceRefs.
      // EXPOSE routinely needs a fact attributed elsewhere in the document — an
      // employer name from the role header, say — that the issue's own evidence
      // never had reason to cite. The prompt's own rule is "facts from the CV",
      // not "facts already listed on this issue".
      const sources = options.diagnosticsLocked ? Object.values(evidence) : [...Object.values(evidence), item.suggestion?.original || ""];
      const guardedSuggestion = item.suggestion?.type === "rewrite" || item.suggestion?.type === "expose";
      // A GAP or QUESTION never has replacement text by design — the reader is
      // meant to supply the missing fact, not receive a drafted one. Drop
      // whatever the model put there (including stray punctuation like ".")
      // instead of rendering an empty proposed-text box.
      const rawProposed = guardedSuggestion ? item.suggestion?.proposed ?? null : null;
      const proposed = rawProposed && /[\p{L}\p{N}]{2,}/u.test(rawProposed) ? rawProposed : null;
      const originalSupported = !options.diagnosticsLocked || Object.values(evidence).some(source => item.suggestion?.original && source.includes(item.suggestion.original));
      const original = originalSupported ? item.suggestion?.original ?? null : null;
      const unsafeRewrite = guardedSuggestion
        ? !original?.trim() || Boolean(proposed && (unsupportedFacts(proposed, sources) || excessiveSemanticNovelty(proposed, sources)))
        : false;
      const suggestion = unsafeRewrite ? {
        type: "question" as const,
        original,
        proposed: null,
        factualityNote: parsed.locale === "en"
          ? "This rewrite needs facts the cited CV fragment does not contain. Confirm them yourself before adding anything."
          : "Ta wersja wymaga faktów, których nie ma w cytowanym fragmencie CV. Potwierdź je, zanim cokolwiek dopiszesz.",
      } : item.suggestion ? { ...item.suggestion, original, proposed } : item.suggestion;
      return {
        ...item,
        severity: item.severity === "critical" && item.confidence === "low" ? "important" as const : item.severity,
        evidenceRefs,
        // The model wrote its action for the rewrite it proposed. Once the guard
        // downgrades that to a question, an action still saying "rewrite this"
        // contradicts both the type and the note, so let it be regenerated.
        action: normalizeIssueAction({ action: unsafeRewrite ? "" : item.action, suggestionType: suggestion?.type, title: item.title, locale: parsed.locale, factualityNote: suggestion?.factualityNote }),
        suggestion,
      };
    });
  const originalActions = new Map(issues.map(issue => [issue.id, issue.action]));
  // The quoted assessment already established this diagnosis and severity.
  // Legacy text repairs can confuse checks of the project with a distinct gap
  // in post-delivery operations, then replace the specific advice with a template.
  if (!options.diagnosticsLocked) issues = issues.map(issue => normalizeDiagnosticKind(issue, validRefs, parsed.locale));
  const policyAdjustedActions = new Map(issues.filter(issue => originalActions.get(issue.id) !== issue.action).map(issue => [issue.id, issue]));
  if (!options.diagnosticsLocked && parsed.document.targetSeniority === "first_job") issues = prioritizeFirstJobIssues(issues, categoryScores);
  const nextSteps = alignNextSteps(parsed.nextSteps.map(step => {
    const adjusted = step.issueId ? policyAdjustedActions.get(step.issueId) : undefined;
    return adjusted ? { ...step, action: adjusted.action, title: parsed.locale === "pl" ? "Doprecyzuj zakres istniejącej weryfikacji" : "Clarify the scope of existing verification" } : step;
  }), issues);
  const recruiterPerspective = {
    ...parsed.recruiterPerspective,
    positiveSignals: parsed.recruiterPerspective.positiveSignals
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }))
      .filter((item) => item.evidenceRefs.length > 0),
    reservations: parsed.recruiterPerspective.reservations
      .map((item) => {
        const adjusted = item.issueId ? policyAdjustedActions.get(item.issueId) : undefined;
        return { ...item, ...(adjusted ? { title: adjusted.title, explanation: adjusted.explanation } : {}), evidenceRefs: item.kind === "gap" ? [] : keep(item.evidenceRefs) };
      })
      .filter((item) => item.kind === "gap" || item.evidenceRefs.length > 0),
    likelyInterviewQuestions: parsed.recruiterPerspective.likelyInterviewQuestions
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) })),
  };
  if (recruiterPerspective.reservations.some(item => item.issueId !== undefined)) {
    const order = new Map(issues.map((issue, index) => [issue.id, index]));
    recruiterPerspective.reservations = recruiterPerspective.reservations
      .filter(item => item.issueId && order.has(item.issueId))
      .sort((a, b) => order.get(a.issueId!)! - order.get(b.issueId!)!);
  }
  const usedRefs = new Set([
    ...categoryScores.flatMap((item) => item.evidenceRefs),
    ...strengths.flatMap((item) => item.evidenceRefs),
    ...issues.flatMap((item) => [...item.evidenceRefs, ...(item.verificationEvidenceRefs || [])]),
    ...recruiterPerspective.positiveSignals.flatMap((item) => item.evidenceRefs),
    ...recruiterPerspective.reservations.flatMap((item) => item.evidenceRefs),
    ...recruiterPerspective.likelyInterviewQuestions.flatMap((item) => item.evidenceRefs),
  ]);
  const evidenceMap = Object.fromEntries([...usedRefs]
    .filter((ref) => validRefs.has(ref) && typeof evidence[ref] === "string")
    .map((ref) => [ref, evidence[ref].trim().slice(0, 600)]));
  return normalizeReportRecommendations({ ...parsed, evidenceMap, recruiterPerspective, categoryScores, strengths, issues, nextSteps, summary: { ...parsed.summary, overallScore: calculateOverall(categoryScores) } });
}

export function withRecruiterPerspective(report: CVReport): CVReport {
  report = normalizeReportRecommendations(report);
  if (report.recruiterPerspective) return report;
  const ranks = { first_job: 0, junior: 0, mid: 1, senior: 2, lead: 3 } as const;
  const target = report.document.targetSeniority;
  const perceived = report.document.perceivedSeniority;
  const seniorityAlignment = target === "auto" || perceived === "unclear"
    ? "unclear"
    : target === perceived || (target === "first_job" && perceived === "junior")
      ? "aligned"
      : ranks[perceived] < ranks[target]
        ? "undersold"
        : "unsupported";
  const alignmentCopy = report.locale === "en" ? {
    aligned: "The perceived level is aligned with the selected target.",
    undersold: "The document communicates a lower level than the target, even though it may not show all of the candidate's experience.",
    unsupported: "The selected level does not yet have enough visible support in the document.",
    unclear: "The level remains ambiguous based on the document alone.",
  } as const : {
    aligned: "Odczytany poziom jest zgodny z poziomem wskazanym w analizie.",
    undersold: "Dokument komunikuje niższy poziom niż wskazany cel, mimo że może nie pokazywać całego doświadczenia.",
    unsupported: "Deklarowany poziom nie ma jeszcze wystarczająco widocznego uzasadnienia w dokumencie.",
    unclear: "Na podstawie samego dokumentu poziom pozostaje niejednoznaczny.",
  } as const;
  return {
    ...report,
    recruiterPerspective: {
      profileSummary: report.summary.oneSentenceVerdict,
      seniorityAlignment,
      seniorityAlignmentExplanation: alignmentCopy[seniorityAlignment],
      positiveSignals: report.strengths.slice(0, 3).map(({ title, explanation, evidenceRefs }) => ({ title, explanation, evidenceRefs })),
      reservations: report.issues.slice(0, 3).map(({ title, explanation, evidenceRefs }) => ({
        title, explanation, evidenceRefs, kind: evidenceRefs.length ? "evidence" as const : "gap" as const,
      })),
      likelyInterviewQuestions: report.issues.slice(0, 3).map(({ title, whyItMatters, evidenceRefs }) => ({
        question: report.locale === "en" ? `How would you clarify: ${title.toLocaleLowerCase("en-GB")}?` : `Jak doprecyzujesz: ${title.toLocaleLowerCase("pl-PL")}?`,
        whyThisQuestion: whyItMatters,
        evidenceRefs,
      })),
    },
  };
}

const severityRank = { critical: 3, important: 2, minor: 1 } as const;
const confidenceRank = { high: 3, medium: 2, low: 1 } as const;

function redactTeaserEvidence(value: string): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[link redacted]")
    .replace(/(?:\+|00)\d[\d\s().-]{7,}\d|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{3}\b/g, "[phone redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function freeActionDirection(category: string, locale: CVReport["locale"]): string {
  const directions = locale === "en"
    ? {
      impact: "Make the result of this work clearer, without adding facts you cannot verify.",
      ownership: "Make your role in the work clearer, without overstating responsibility.",
      clarity: "Make the strongest relevant signal easier to notice in the first scan.",
      fallback: "Clarify this signal using only details you can verify.",
    }
    : {
      impact: "Doprecyzuj rezultat tej pracy bez dodawania informacji, których nie możesz potwierdzić.",
      ownership: "Doprecyzuj swoją rolę w tej pracy bez zawyżania zakresu odpowiedzialności.",
      clarity: "Ułatw zauważenie najmocniejszego sygnału już przy pierwszym skanie CV.",
      fallback: "Doprecyzuj ten sygnał wyłącznie informacjami, które możesz potwierdzić.",
    };
  return directions[category as keyof typeof directions] || directions.fallback;
}

/** Selects one useful, evidence-backed issue deterministically for the unpaid report. */
export function featuredFreeIssue(report: CVReport): TeaserReport["featuredIssue"] {
  const candidates = report.issues.flatMap((issue, index) => {
    if (issue.confidence === "low") return [];
    const evidence = issue.evidenceRefs
      .map((ref) => redactTeaserEvidence(report.evidenceMap?.[ref] || ""))
      .find((value) => value.length >= 16);
    const gap = report.document.targetSeniority === "first_job" && Boolean(issue.diagnosticKind)
      && (issue.suggestion?.type === "gap" || issue.diagnosticKind === "missing_verification");
    if (!evidence && !gap) return [];
    return [{ issue, index, evidence: gap ? (report.locale === "pl" ? "Raport wskazuje brak informacji w dokumencie, nie brak umiejętności osoby." : "The report identifies missing information in the document, not missing personal skill.") : evidence!, evidenceKind: gap ? "gap" as const : "quote" as const, evidenceQuality: evidence ? Math.min(evidence.length, 160) : 0 }];
  });
  candidates.sort((left, right) =>
    severityRank[right.issue.severity] - severityRank[left.issue.severity]
    || confidenceRank[right.issue.confidence] - confidenceRank[left.issue.confidence]
    // The prompt orders issues by how much fixing them would change the
    // document's reception, so the model's own ranking is a deliberate signal.
    // Quote length is not: it only decided the teaser because it happened to
    // outrank that ordering, and the 160-character cap hid it whenever every
    // quote was long.
    || left.index - right.index
    || right.evidenceQuality - left.evidenceQuality,
  );
  const selected = candidates[0];
  if (!selected) return null;
  return {
    title: selected.issue.title,
    evidence: selected.evidence,
    evidenceKind: selected.evidenceKind,
    interpretation: selected.issue.explanation,
    actionDirection: freeActionDirection(selected.issue.category, report.locale),
  };
}

export function toTeaser(report: CVReport): TeaserReport {
  const normalized = withRecruiterPerspective(report);
  const severityCounts = normalized.issues.reduce<TeaserReport["severityCounts"]>((counts, issue) => {
    counts[issue.severity] += 1;
    return counts;
  }, { critical: 0, important: 0, minor: 0 });
  return {
    version: normalized.version,
    locale: normalized.locale,
    profileSummary: normalized.recruiterPerspective.profileSummary,
    firstImpression: normalized.recruiterSimulation.after20Seconds,
    issueCount: normalized.issues.length,
    severityCounts,
    featuredIssue: featuredFreeIssue(normalized),
    ats: normalized.ats,
  };
}
