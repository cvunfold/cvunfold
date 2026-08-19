import type { Attribution } from "@/lib/analytics/attribution";

// supported_it/other_it/unclear are unchanged; non_it was replaced by a closed set of
// specific non-IT categories plus other_non_it, so "who clicks the ad by mistake" is
// answerable without ever storing free text. Every value here must also exist in the
// role_category check constraint and in private.classify_anonymous_perceived_role
// (supabase/migrations) — the two classifiers must be kept in lockstep by hand.
export const anonymousRoleCategories = [
  "supported_it", "other_it", "unclear",
  "architecture_construction", "healthcare_medical", "legal", "education_academia",
  "finance_accounting", "sales_marketing", "hr_recruiting", "public_sector",
  "hospitality_retail", "creative_arts_media", "engineering_manufacturing_nonit",
  "skilled_trades", "science_research_nonit", "other_non_it",
] as const;
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

  // Checked before the bare "developer" pattern below: business/sales development titles
  // contain "developer" but describe sales work, not software work.
  if (/(?:business|sales) development|business developer/.test(role)) return "sales_marketing";

  if (/(?:front[- ]?end|back[- ]?end|full[- ]?stack|software|web|mobile|android|ios|embedded|game) (?:developer|engineer|programmer|programist(?:a|ka))/.test(role)
    || /(?:^| )(?:developer|programmer|programist(?:a|ka))(?: |$)/.test(role)
    || /(?:^| )(?:qa|quality assurance|software tester|test automation|automation tester|tester automatyzujacy)(?: |$)/.test(role)
    || /(?:^| )(?:devops|site reliability engineer|sre|platform engineer)(?: |$)/.test(role)) return "supported_it";

  if (/(?:data (?:engineer|scientist|analyst)|machine learning|ml engineer|ai engineer|security engineer|cybersecurity|cloud engineer|infrastructure engineer|network engineer|system administrator|administrator systemow|database administrator|dba|it support|help ?desk|solutions architect|software architect|product manager|product owner|scrum master|business analyst|technical writer|technical project manager|it recruiter|recruiter it)/.test(role)
    || /(?:^| )(?:ux|ui) (?:designer|researcher)(?: |$)/.test(role)) return "other_it";

  if (/architek(?:t|tka|tura)|urbanist(?:a|ka)|budownictwo|konstruktor budowlany|architect(?:ure)?|urban plan(?:ner|ning)|building design/.test(role)) return "architecture_construction";

  if (/lekar(?:z|ka)|pielegniar(?:z|ka)|ratownik medyczny|stomatolog|dentyst(?:a|ka)|farmaceut(?:a|ka)|fizjoterapeut(?:a|ka)|weterynarz|physician|doctor|nurse|dentist|pharmacist|physiotherapist|veterinarian|medical|healthcare/.test(role)) return "healthcare_medical";

  if (/prawni(?:k|czka)|adwokat(?:ka)?|radca prawny|notariusz|sedzia|prokurator(?:ka)?|lawyer|attorney|solicitor|legal counsel|paralegal|judge/.test(role)) return "legal";

  if (/nauczyciel(?:ka)?|pedagog|wykladowca|nauczyciel akademicki|profesor|teacher|professor|lecturer|tutor|academic/.test(role)) return "education_academia";

  if (/ksiegow(?:y|a|osc)|analityk finansowy|doradca finansowy|kontroler finansowy|bankowiec|accountant|accounting|bookkeep(?:er|ing)|financial analyst|auditor|financial controller|bank(?:ing|er)/.test(role)) return "finance_accounting";

  if (/sprzedawc(?:a|zyni)|sprzedaz|handlowiec|przedstawiciel handlowy|marketing(?:owiec)?|specjalist(?:a|ka) ds marketingu|sales(?:person)?|marketer|account executive|brand manager/.test(role)) return "sales_marketing";

  if (/kadry|dzial personalny|specjalist(?:a|ka) hr|human resources|hr (?:specialist|business partner)|talent acquisition/.test(role)) return "hr_recruiting";

  if (/urzednik|administracja publiczna|samorzad|policjant(?:ka)?|straza(?:k|czka)|zolnierz|civil servant|public administration|police officer|firefighter|military|government official/.test(role)) return "public_sector";

  if (/kelner(?:ka)?|kucharz|szef kuchni|barista|recepcjonist(?:a|ka)|kasjer(?:ka)?|waiter|waitress|chef|cook|receptionist|retail (?:associate|worker)|cashier|hospitality/.test(role)) return "hospitality_retail";

  if (/grafik|ilustrator(?:ka)?|fotograf(?:ka)?|dziennikarz|dziennikarka|redaktor(?:ka)?|aktor(?:ka)?|muzyk|artyst(?:a|ka)|graphic designer|illustrator|photographer|journalist|editor|actor|musician|artist/.test(role)) return "creative_arts_media";

  if (/inzynier (?:mechanik|elektryk|budownictwa|produkcji|procesu|chemik)|mechanical engineer|electrical engineer|civil engineer|production engineer|process engineer|chemical engineer/.test(role)) return "engineering_manufacturing_nonit";

  if (/elektryk|hydraulik|spawacz|mechanik samochodowy|stolarz|murarz|electrician|plumber|welder|(?:auto|car) mechanic|carpenter|mason/.test(role)) return "skilled_trades";

  if (/biolog(?:ka)?|chemik|fizyk(?:iem)?|naukowiec|badacz(?:ka)?|biologist|chemist|physicist|scientist|researcher/.test(role)) return "science_research_nonit";

  return "other_non_it";
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
