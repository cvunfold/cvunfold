import type { TargetRoleId } from "@/lib/roles";

// Deterministic role detection over extracted CV text. No model call: this runs
// on every analysis, and the free tier already pays for a full generation, so an
// extra inference here would be charged against every visitor who never buys.
//
// Being deterministic is also what makes it measurable — the labelled set in
// fixtures/role-detection-cases.json asserts exact outcomes rather than a
// tolerance band, so a regression fails CI instead of drifting quietly between
// runs the way a model-based classifier would. `npm run roles:report` prints the
// accuracy and the confusions behind it.

export type RoleDetection = {
  role: TargetRoleId;
  /** False when the signals were too weak, or too close to separate two roles. */
  confident: boolean;
  /** Per-role scores, highest first. Feeds the offline accuracy report. */
  scores: Array<{ role: TargetRoleId; score: number }>;
};

type RoleSignals = {
  role: Exclude<TargetRoleId, "other">;
  /** Explicit job titles. One match outweighs any pile of skills. */
  titles: RegExp[];
  /** Technologies and practices. Each match adds a little, up to SKILL_CAP. */
  skills: RegExp[];
};

const TITLE_WEIGHT = 10;
const SKILL_WEIGHT = 1;
// A keyword-stuffed CV lists half the ecosystem; without a cap its skill noise
// would outweigh the one title that actually says what the person does.
const SKILL_CAP = 4;
// A title has to beat a rival title by more than a couple of stray skills.
const TITLE_MARGIN = 4;
// Skills alone can decide, but only with a clear lead and enough of them.
const SKILL_ONLY_FLOOR = 4;
const SKILL_ONLY_MARGIN = 3;
// Both-ends evidence is scored against its own, lower bar. Requiring each side to
// reach SKILL_CAP would mean both halves had to max out before the rule could ever
// fire, which no real document does.
const BOTH_ENDS_FLOOR = 3;

// Title patterns stay deliberately strict. "collaborated with QA", "handover to
// DevOps" and similar appear in plenty of CVs that are neither, and a bare-word
// title match would hand those documents the wrong rubric outright. A CV that
// really is QA or DevOps still lands through the skill-only path below.
const ROLE_SIGNALS: RoleSignals[] = [
  {
    role: "frontend_developer",
    titles: [/front[ -]?end (?:developer|engineer|programist(?:a|ka)|dev)\b/, /(?:ui|web) developer\b/],
    skills: [/\breact\b/, /\bvue\b/, /\bangular\b/, /\bsvelte\b/, /next\.?js/, /\bnuxt\b/, /\bredux\b/,
      /\bcss\b/, /\bsass\b/, /\bscss\b/, /tailwind/, /styled[- ]components/, /webpack/, /\bvite\b/,
      /\bwcag\b/, /accessibility/, /dostepnosc/, /design system/, /storybook/],
  },
  {
    role: "backend_developer",
    titles: [/back[ -]?end (?:developer|engineer|programist(?:a|ka)|dev)\b/, /server[- ]side developer\b/],
    skills: [/spring boot/, /\bspring\b/, /\bdjango\b/, /\brails\b/, /\blaravel\b/, /\.net\b/, /nest\.?js/,
      /express\.?js/, /postgres/, /\bmysql\b/, /mongodb/, /\bredis\b/, /\bkafka\b/, /rabbitmq/, /\bgrpc\b/,
      /microservice/, /hibernate/, /rest api/, /api design/, /projektowanie api/],
  },
  {
    role: "fullstack_developer",
    titles: [/full[ -]?stack (?:developer|engineer|programist(?:a|ka)|dev)\b/],
    skills: [/end[- ]to[- ]end (?:delivery|ownership)/, /pelny (?:przeplyw|stack)/],
  },
  {
    role: "mobile_developer",
    titles: [/(?:mobile|android|ios) (?:developer|engineer|programist(?:a|ka)|dev)\b/],
    skills: [/\bswift\b/, /swiftui/, /\bkotlin\b/, /jetpack compose/, /\bflutter\b/, /react native/,
      /\bxcode\b/, /android studio/, /app store/, /google play/],
  },
  {
    role: "qa_test_automation",
    titles: [/\bqa (?:engineer|specialist|automation|lead|analyst|tester)\b/, /quality assurance/,
      /\b(?:software |automation )?tester\b/, /test automation engineer\b/, /\bsdet\b/,
      /inzynier(?:ka)? (?:jakosci|testow)\b/],
    skills: [/selenium/, /cypress/, /playwright/, /appium/, /\bjunit\b/, /testng/, /pytest/,
      /jmeter/, /postman/, /test plan/, /plan testow/, /regression (?:suite|test)/, /testy regresji/],
  },
  {
    role: "devops_platform",
    titles: [/devops (?:engineer|specialist|lead)\b/, /\bsre\b/, /site reliability/,
      /platform engineer\b/, /cloud engineer\b/, /infrastructure engineer\b/],
    skills: [/kubernetes/, /\bk8s\b/, /terraform/, /ansible/, /\bhelm\b/, /jenkins/, /gitlab ci/,
      /github actions/, /argocd/, /prometheus/, /grafana/, /\bci\/cd\b/, /observabilit/,
      /infrastructure as code/],
  },
];

/** Same folding as the anonymous role classifier so PL diacritics never split a match. */
function normalize(value: string): string {
  return value.toLocaleLowerCase("en").normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9+#./\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreRole(text: string, signals: RoleSignals): { score: number; hasTitle: boolean } {
  const hasTitle = signals.titles.some((pattern) => pattern.test(text));
  const skillHits = signals.skills.filter((pattern) => pattern.test(text)).length;
  return { score: (hasTitle ? TITLE_WEIGHT : 0) + Math.min(skillHits * SKILL_WEIGHT, SKILL_CAP), hasTitle };
}

export function detectTargetRole(text: string): RoleDetection {
  const normalized = normalize(text);
  const scored = ROLE_SIGNALS.map((signals) => ({ ...signals, ...scoreRole(normalized, signals) }));
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const scores = ranked.map(({ role, score }) => ({ role: role as TargetRoleId, score }));
  const undetermined: RoleDetection = { role: "other", confident: false, scores };

  const [top, runnerUp] = ranked;
  if (!top || top.score === 0) return undetermined;
  const margin = top.score - (runnerUp?.score || 0);

  if (top.hasTitle) {
    // Two titles this close means the document genuinely claims both. Guessing
    // between them costs the free teaser its accuracy, so say nothing instead.
    if (runnerUp?.hasTitle && margin < TITLE_MARGIN) return undetermined;
    return { role: top.role, confident: true, scores };
  }

  // No title anywhere. Strong evidence on both ends of the stack is the one case
  // where the missing title is itself the answer.
  const frontend = scored.find((entry) => entry.role === "frontend_developer");
  const backend = scored.find((entry) => entry.role === "backend_developer");
  if (frontend && backend && frontend.score >= BOTH_ENDS_FLOOR && backend.score >= BOTH_ENDS_FLOOR) {
    return { role: "fullstack_developer", confident: true, scores };
  }

  if (top.score >= SKILL_ONLY_FLOOR && margin >= SKILL_ONLY_MARGIN) {
    return { role: top.role, confident: true, scores };
  }
  return undetermined;
}
