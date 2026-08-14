import type { Locale } from "@/lib/i18n";

export const TARGET_ROLES = [
  {
    id: "frontend_developer",
    label: "Frontend Developer",
    shortLabel: "FE",
    description: "Interfejsy, wydajność, dostępność i architektura UI.",
    credibilityLabel: "Wiarygodność frontendowa",
    systemsLabel: "Architektura frontendowa i myślenie systemowe",
    evaluationFocus: ["jakość i architektura interfejsów", "wydajność i dostępność", "design systemy i wpływ na produkt"],
    experimental: false,
  },
  {
    id: "backend_developer",
    label: "Backend Developer",
    shortLabel: "BE",
    description: "API, dane, skalowalność i niezawodność systemów.",
    credibilityLabel: "Wiarygodność backendowa",
    systemsLabel: "Architektura i myślenie systemowe",
    evaluationFocus: ["projektowanie API i modeli danych", "niezawodność i skalowalność", "bezpieczeństwo i operowanie systemem"],
    experimental: false,
  },
  {
    id: "fullstack_developer",
    label: "Full-stack Developer",
    shortLabel: "FS",
    description: "Dostarczanie end-to-end z widoczną głębią techniczną.",
    credibilityLabel: "Wiarygodność techniczna end-to-end",
    systemsLabel: "Architektura end-to-end",
    evaluationFocus: ["odpowiedzialność za pełny przepływ rozwiązania", "granice między frontendem, backendem i danymi", "szerokość kompetencji poparta techniczną głębią"],
    experimental: false,
  },
  {
    id: "mobile_developer",
    label: "Mobile Developer",
    shortLabel: "MO",
    description: "Platforma, cykl wydawniczy, jakość i performance aplikacji.",
    credibilityLabel: "Wiarygodność mobile",
    systemsLabel: "Architektura i ograniczenia platform mobilnych",
    evaluationFocus: ["ograniczenia i wzorce platform mobilnych", "wydajność, stabilność i cykl życia aplikacji", "release, monitoring i doświadczenie użytkownika"],
    experimental: false,
  },
  {
    id: "qa_test_automation",
    label: "QA / Test Automation",
    shortLabel: "QA",
    description: "Strategia jakości, ryzyko, automatyzacja i testowalność.",
    credibilityLabel: "Wiarygodność w jakości i automatyzacji",
    systemsLabel: "Strategia jakości i myślenie o ryzyku",
    evaluationFocus: ["strategia jakości i priorytetyzacja ryzyka", "automatyzacja oraz jakość sygnału z testów", "testowalność i wpływ na proces dostarczania"],
    experimental: false,
  },
  {
    id: "devops_platform",
    label: "DevOps / Platform Engineer",
    shortLabel: "OP",
    description: "Niezawodność, delivery, observability i automatyzacja infrastruktury.",
    credibilityLabel: "Wiarygodność operacyjna i platformowa",
    systemsLabel: "Niezawodność i myślenie platformowe",
    evaluationFocus: ["niezawodność i observability", "automatyzacja infrastruktury oraz delivery", "bezpieczeństwo, koszt i developer experience"],
    experimental: false,
  },
  {
    id: "other",
    label: "Pozostałe",
    shortLabel: "IN",
    description: "Eksperymentalna analiza oparta na ogólnych kryteriach CV.",
    credibilityLabel: "Wiarygodność zawodowa",
    systemsLabel: "Zakres i złożoność odpowiedzialności",
    evaluationFocus: ["wpływ i rezultaty", "zakres odpowiedzialności i wiarygodność dowodów", "jasność profilu oraz współpraca"],
    experimental: true,
  },
] as const;

export type TargetRoleId = (typeof TARGET_ROLES)[number]["id"];
export type TargetRoleProfile = {
  id: TargetRoleId;
  label: string;
  shortLabel: string;
  description: string;
  credibilityLabel: string;
  systemsLabel: string;
  evaluationFocus: readonly string[];
  experimental: boolean;
};

const EN_ROLE_COPY: Record<TargetRoleId, Pick<TargetRoleProfile, "description" | "credibilityLabel" | "systemsLabel" | "evaluationFocus">> = {
  frontend_developer: {
    description: "Interfaces, performance, accessibility and UI architecture.",
    credibilityLabel: "Frontend credibility",
    systemsLabel: "Frontend architecture and systems thinking",
    evaluationFocus: ["interface quality and architecture", "performance and accessibility", "design systems and product impact"],
  },
  backend_developer: {
    description: "APIs, data, scalability and system reliability.",
    credibilityLabel: "Backend credibility",
    systemsLabel: "Architecture and systems thinking",
    evaluationFocus: ["API and data model design", "reliability and scalability", "security and operating systems"],
  },
  fullstack_developer: {
    description: "End-to-end delivery backed by visible technical depth.",
    credibilityLabel: "End-to-end technical credibility",
    systemsLabel: "End-to-end architecture",
    evaluationFocus: ["ownership of the complete solution flow", "boundaries between frontend, backend and data", "breadth backed by technical depth"],
  },
  mobile_developer: {
    description: "Platform constraints, release lifecycle, quality and app performance.",
    credibilityLabel: "Mobile engineering credibility",
    systemsLabel: "Mobile architecture and platform constraints",
    evaluationFocus: ["mobile platform constraints and patterns", "performance, stability and application lifecycle", "release, monitoring and user experience"],
  },
  qa_test_automation: {
    description: "Quality strategy, risk, automation and testability.",
    credibilityLabel: "Quality and automation credibility",
    systemsLabel: "Quality strategy and risk thinking",
    evaluationFocus: ["quality strategy and risk prioritisation", "automation and test signal quality", "testability and delivery impact"],
  },
  devops_platform: {
    description: "Reliability, delivery, observability and infrastructure automation.",
    credibilityLabel: "Operational and platform credibility",
    systemsLabel: "Reliability and platform thinking",
    evaluationFocus: ["reliability and observability", "infrastructure and delivery automation", "security, cost and developer experience"],
  },
  other: {
    description: "Experimental analysis based on general CV criteria.",
    credibilityLabel: "Professional credibility",
    systemsLabel: "Scope and complexity of responsibility",
    evaluationFocus: ["impact and outcomes", "scope of responsibility and evidence credibility", "profile clarity and collaboration"],
  },
};

const EN_ROLE_LABELS: Partial<Record<TargetRoleId, string>> = { other: "Other" };

const roleIds = new Set<string>(TARGET_ROLES.map((role) => role.id));

export function parseTargetRoleId(value: unknown): TargetRoleId | null {
  const candidate = String(value || "");
  return roleIds.has(candidate) ? candidate as TargetRoleId : null;
}

export function getTargetRoleProfile(roleId: TargetRoleId, locale: Locale = "pl"): TargetRoleProfile {
  const role = TARGET_ROLES.find((item) => item.id === roleId) ?? TARGET_ROLES[0];
  const localizedLabel = EN_ROLE_LABELS[role.id];
  return locale === "en" ? { ...role, ...EN_ROLE_COPY[role.id], ...(localizedLabel ? { label: localizedLabel } : {}) } : role;
}

export function getTargetRoleOptions(locale: Locale): readonly TargetRoleProfile[] {
  return TARGET_ROLES.map((role) => getTargetRoleProfile(role.id, locale));
}
