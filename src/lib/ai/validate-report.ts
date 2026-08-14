import type { CVReport, EvidenceMap, ModelReport, TeaserReport } from "./schemas/report";
import { reportSchema } from "./schemas/report";
import type { RubricCategory } from "@/lib/rubrics/technical-v1";
import { normalizeIssueAction } from "./issue-action";

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
    .filter((token) => token.length >= 4 && !rewriteStopwords.has(token)));
  const sourceTokens = tokens(sources.join(" "));
  const proposedTokens = [...tokens(proposed)];
  return proposedTokens.filter((token) => !sourceTokens.has(token)).length > 2;
}

export function validateEvidence(report: ModelReport, validRefs: Set<string>, evidence: EvidenceMap = {}): CVReport {
  const parsed = reportSchema.parse(report);
  const keep = (refs: string[]) => refs.filter((ref) => validRefs.has(ref));
  const categoryScores = parsed.categoryScores.map((category) => ({ ...category, evidenceRefs: keep(category.evidenceRefs) }));
  const strengths = parsed.strengths.filter((item) => keep(item.evidenceRefs).length > 0).map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }));
  const issues = parsed.issues.filter((item) => item.suggestion?.type === "gap" || item.suggestion?.type === "question" || keep(item.evidenceRefs).length > 0)
    .map((item) => {
      // A GAP describes missing visible evidence. A model may cite the line that
      // admits the omission, but retaining that ref makes the gap look like a
      // supported claim. Keep the boundary deterministic on the server.
      const evidenceRefs = item.suggestion?.type === "gap" ? [] : keep(item.evidenceRefs);
      const sources = [...evidenceRefs.map((ref) => evidence[ref] || ""), item.suggestion?.original || ""];
      const guardedSuggestion = item.suggestion?.type === "rewrite" || item.suggestion?.type === "expose";
      const unsafeRewrite = guardedSuggestion
        ? !item.suggestion?.original?.trim() || Boolean(item.suggestion?.proposed && (unsupportedFacts(item.suggestion.proposed, sources) || excessiveSemanticNovelty(item.suggestion.proposed, sources)))
        : false;
      const suggestion = unsafeRewrite ? {
        type: "question" as const,
        original: item.suggestion?.original || null,
        proposed: null,
        factualityNote: parsed.locale === "en"
          ? "This rewrite needs facts not present in the cited CV fragment. Ask the candidate before writing it."
          : "Ta wersja wymaga faktów, których nie ma w cytowanym fragmencie CV. Najpierw dopytaj kandydata.",
      } : item.suggestion;
      return {
        ...item,
        severity: item.severity === "critical" && item.confidence === "low" ? "important" as const : item.severity,
        evidenceRefs,
        action: normalizeIssueAction({ action: item.action, suggestionType: suggestion?.type, title: item.title, locale: parsed.locale, factualityNote: suggestion?.factualityNote }),
        suggestion,
      };
    });
  const recruiterPerspective = {
    ...parsed.recruiterPerspective,
    positiveSignals: parsed.recruiterPerspective.positiveSignals
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) }))
      .filter((item) => item.evidenceRefs.length > 0),
    reservations: parsed.recruiterPerspective.reservations
      .map((item) => ({ ...item, evidenceRefs: item.kind === "gap" ? [] : keep(item.evidenceRefs) }))
      .filter((item) => item.kind === "gap" || item.evidenceRefs.length > 0),
    likelyInterviewQuestions: parsed.recruiterPerspective.likelyInterviewQuestions
      .map((item) => ({ ...item, evidenceRefs: keep(item.evidenceRefs) })),
  };
  const usedRefs = new Set([
    ...categoryScores.flatMap((item) => item.evidenceRefs),
    ...strengths.flatMap((item) => item.evidenceRefs),
    ...issues.flatMap((item) => item.evidenceRefs),
    ...recruiterPerspective.positiveSignals.flatMap((item) => item.evidenceRefs),
    ...recruiterPerspective.reservations.flatMap((item) => item.evidenceRefs),
    ...recruiterPerspective.likelyInterviewQuestions.flatMap((item) => item.evidenceRefs),
  ]);
  const evidenceMap = Object.fromEntries([...usedRefs]
    .filter((ref) => validRefs.has(ref) && typeof evidence[ref] === "string")
    .map((ref) => [ref, evidence[ref].trim().slice(0, 600)]));
  return { ...parsed, evidenceMap, recruiterPerspective, categoryScores, strengths, issues, summary: { ...parsed.summary, overallScore: calculateOverall(categoryScores) } };
}

export function withRecruiterPerspective(report: CVReport): CVReport {
  if (report.recruiterPerspective) return report;
  const ranks = { junior: 0, mid: 1, senior: 2, lead: 3 } as const;
  const target = report.document.targetSeniority;
  const perceived = report.document.perceivedSeniority;
  const seniorityAlignment = target === "auto" || perceived === "unclear"
    ? "unclear"
    : target === perceived
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

function teaserHook(category: string | undefined, locale: CVReport["locale"]): string {
  const hooks = locale === "en"
    ? {
      impact: "Your experience may not make the outcomes of your work immediately clear.",
      ownership: "Your experience may not clearly communicate the scope of your responsibility.",
      credibility: "Your experience may not clearly demonstrate your technical credibility.",
      architecture: "The technical scope of your decisions may not be clearly visible.",
      collaboration: "The scope of your collaboration may not be clear from the document.",
      clarity: "The strongest parts of your CV may not be visible straight away.",
      ats: "The document structure may make the key information harder to read quickly.",
      fallback: "One part of your CV may be weakening how your experience is received.",
    }
    : {
      impact: "Twoje doświadczenie może nie komunikować od razu efektów Twojej pracy.",
      ownership: "Twoje doświadczenie może nie komunikować jasno zakresu odpowiedzialności.",
      credibility: "Twoje doświadczenie może nie komunikować jasno Twojej wiarygodności technicznej.",
      architecture: "Skala techniczna Twoich decyzji może nie być jasno widoczna.",
      collaboration: "Zakres Twojej współpracy może nie być czytelny z dokumentu.",
      clarity: "Najmocniejsze elementy Twojego CV mogą nie być widoczne od razu.",
      ats: "Układ dokumentu może utrudniać szybkie odczytanie najważniejszych informacji.",
      fallback: "Jeden element CV może osłabiać odbiór Twojego doświadczenia.",
    };
  return hooks[category as keyof typeof hooks] || hooks.fallback;
}

export function toTeaser(report: CVReport): TeaserReport {
  const normalized = withRecruiterPerspective(report);
  const featured = normalized.issues.find((issue) => issue.severity === "critical") || normalized.issues[0];
  return { version: normalized.version, locale: normalized.locale, profileSummary: normalized.recruiterPerspective.profileSummary, issueCount: normalized.issues.length, hook: teaserHook(featured?.category, normalized.locale), findingTitle: featured?.title || null };
}
