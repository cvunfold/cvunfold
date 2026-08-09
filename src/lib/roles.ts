export const TARGET_ROLES = [
  {
    id: "frontend_developer",
    label: "Frontend Developer",
    shortLabel: "FE",
    description: "Interfejsy, wydajność, dostępność i architektura UI.",
    credibilityLabel: "Wiarygodność frontendowa",
    systemsLabel: "Architektura frontendowa i myślenie systemowe",
    evaluationFocus: ["jakość i architektura interfejsów", "wydajność i dostępność", "design systemy i wpływ na produkt"],
  },
  {
    id: "backend_developer",
    label: "Backend Developer",
    shortLabel: "BE",
    description: "API, dane, skalowalność i niezawodność systemów.",
    credibilityLabel: "Wiarygodność backendowa",
    systemsLabel: "Architektura i myślenie systemowe",
    evaluationFocus: ["projektowanie API i modeli danych", "niezawodność i skalowalność", "bezpieczeństwo i operowanie systemem"],
  },
  {
    id: "fullstack_developer",
    label: "Full-stack Developer",
    shortLabel: "FS",
    description: "Dostarczanie end-to-end z widoczną głębią techniczną.",
    credibilityLabel: "Wiarygodność techniczna end-to-end",
    systemsLabel: "Architektura end-to-end",
    evaluationFocus: ["odpowiedzialność za pełny przepływ rozwiązania", "granice między frontendem, backendem i danymi", "szerokość kompetencji poparta techniczną głębią"],
  },
  {
    id: "mobile_developer",
    label: "Mobile Developer",
    shortLabel: "MO",
    description: "Platforma, cykl wydawniczy, jakość i performance aplikacji.",
    credibilityLabel: "Wiarygodność mobile",
    systemsLabel: "Architektura i ograniczenia platform mobilnych",
    evaluationFocus: ["ograniczenia i wzorce platform mobilnych", "wydajność, stabilność i cykl życia aplikacji", "release, monitoring i doświadczenie użytkownika"],
  },
  {
    id: "qa_test_automation",
    label: "QA / Test Automation",
    shortLabel: "QA",
    description: "Strategia jakości, ryzyko, automatyzacja i testowalność.",
    credibilityLabel: "Wiarygodność w jakości i automatyzacji",
    systemsLabel: "Strategia jakości i myślenie o ryzyku",
    evaluationFocus: ["strategia jakości i priorytetyzacja ryzyka", "automatyzacja oraz jakość sygnału z testów", "testowalność i wpływ na proces dostarczania"],
  },
  {
    id: "devops_platform",
    label: "DevOps / Platform Engineer",
    shortLabel: "OP",
    description: "Niezawodność, delivery, observability i automatyzacja infrastruktury.",
    credibilityLabel: "Wiarygodność operacyjna i platformowa",
    systemsLabel: "Niezawodność i myślenie platformowe",
    evaluationFocus: ["niezawodność i observability", "automatyzacja infrastruktury oraz delivery", "bezpieczeństwo, koszt i developer experience"],
  },
] as const;

export type TargetRoleId = (typeof TARGET_ROLES)[number]["id"];
export type TargetRoleProfile = (typeof TARGET_ROLES)[number];

const roleIds = new Set<string>(TARGET_ROLES.map((role) => role.id));

export function parseTargetRoleId(value: unknown): TargetRoleId | null {
  const candidate = String(value || "");
  return roleIds.has(candidate) ? candidate as TargetRoleId : null;
}

export function getTargetRoleProfile(roleId: TargetRoleId): TargetRoleProfile {
  return TARGET_ROLES.find((role) => role.id === roleId) ?? TARGET_ROLES[0];
}
