import type { Attribution } from "@/lib/analytics/attribution";

export const anonymousRoleCategories = ["supported_it", "other_it", "non_it", "unclear"] as const;
export type AnonymousRoleCategory = (typeof anonymousRoleCategories)[number];

export const anonymousSourceBuckets = ["google_cpc", "other"] as const;
export type AnonymousSourceBucket = (typeof anonymousSourceBuckets)[number];

export const ANONYMOUS_ROLE_MIN_CELL_COUNT = 5;

export type AnonymousRoleAggregateRow = {
  role_category: AnonymousRoleCategory;
  source_bucket: AnonymousSourceBucket;
  analysis_count: number;
};

function normalizeRole(value: string): string {
  return value.trim().toLocaleLowerCase("en").normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9+#.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyAnonymousRole(perceivedRole: string): AnonymousRoleCategory {
  const role = normalizeRole(perceivedRole);
  if (!role
    || /^(?:unknown|unclear|n a|not specified|not clear|nieznan[ay]|niejasn[ay]|nieokreslon[ay]|brak danych|student|freelancer|consultant|manager|specialist|engineer)$/.test(role)
    || /(?:cannot|unable to|insufficient).*(?:determine|infer)/.test(role)
    || /nie (?:mozna|da sie).*(?:okreslic|ustalic)/.test(role)) return "unclear";

  // These titles contain developer-like wording but describe sales rather than software work.
  if (/(?:business|sales) development|business developer/.test(role)) return "non_it";

  if (/(?:front[- ]?end|back[- ]?end|full[- ]?stack|software|web|mobile|android|ios|embedded|game) (?:developer|engineer|programmer|programist(?:a|ka))/.test(role)
    || /(?:^| )(?:developer|programmer|programist(?:a|ka))(?: |$)/.test(role)
    || /(?:^| )(?:qa|quality assurance|software tester|test automation|automation tester|tester automatyzujacy)(?: |$)/.test(role)
    || /(?:^| )(?:devops|site reliability engineer|sre|platform engineer)(?: |$)/.test(role)) return "supported_it";

  if (/(?:data (?:engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|security engineer|cybersecurity|cloud engineer|infrastructure engineer|network engineer|system administrator|administrator systemow|database administrator|dba|it support|help ?desk|solutions architect|software architect|product manager|product owner|scrum master|business analyst|technical writer|technical project manager|it recruiter|recruiter it)/.test(role)
    || /(?:^| )(?:ux|ui) (?:designer|researcher)(?: |$)/.test(role)) return "other_it";

  return "non_it";
}

export function classifyAnonymousSource(attribution: Attribution): AnonymousSourceBucket {
  const source = attribution.source?.trim().toLocaleLowerCase("en");
  const medium = attribution.medium?.trim().toLocaleLowerCase("en");
  return attribution.handoff_origin === "google_cpc"
    || source === "google" && ["cpc", "ppc", "paid_search"].includes(medium || "")
    ? "google_cpc"
    : "other";
}

function reportableRoleCounts(rows: AnonymousRoleAggregateRow[]) {
  const totals = Object.fromEntries(anonymousRoleCategories.map((category) => [category,
    rows.filter((row) => row.role_category === category).reduce((sum, row) => sum + Number(row.analysis_count || 0), 0),
  ])) as Record<AnonymousRoleCategory, number>;
  const counts: Partial<Record<AnonymousRoleCategory, number>> = {};
  let suppressed = 0;
  for (const category of anonymousRoleCategories) {
    if (totals[category] >= ANONYMOUS_ROLE_MIN_CELL_COUNT) counts[category] = totals[category];
    else suppressed += totals[category];
  }
  return { counts, suppressed };
}

export function summarizeAnonymousRoleStatistics(rows: AnonymousRoleAggregateRow[]) {
  const total = rows.reduce((sum, row) => sum + Number(row.analysis_count || 0), 0);
  return {
    total,
    minimumReportableCellCount: ANONYMOUS_ROLE_MIN_CELL_COUNT,
    roles: reportableRoleCounts(rows),
    bySource: Object.fromEntries(anonymousSourceBuckets.map((source) => {
      const sourceRows = rows.filter((row) => row.source_bucket === source);
      return [source, {
        total: sourceRows.reduce((sum, row) => sum + Number(row.analysis_count || 0), 0),
        roles: reportableRoleCounts(sourceRows),
      }];
    })),
  };
}
