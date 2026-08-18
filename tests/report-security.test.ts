import { describe, expect, it } from "vitest";
import { createMockReport } from "@/lib/ai/mock-report";
import { featuredFreeIssue, toTeaser, validateEvidence, withRecruiterPerspective } from "@/lib/ai/validate-report";
import type { CVReport } from "@/lib/ai/schemas/report";
describe("report boundary",()=>{
  it("sends only one evidence-backed finding and a 20-second impression in the unpaid teaser",()=>{const report=createMockReport();const teaser=toTeaser(report);expect(teaser).toMatchObject({version:report.version,locale:report.locale,profileSummary:report.recruiterPerspective.profileSummary,firstImpression:report.recruiterSimulation.after20Seconds,issueCount:report.issues.length,severityCounts:{critical:1,important:1,minor:1},featuredIssue:{title:"Efekty pracy giną pod listą obowiązków",evidence:"Realizacja funkcji produktowych w React i TypeScript we współpracy z backendem i zespołem produktowym.",interpretation:"Najmocniejsze doświadczenie jest opisane jako wykonywane czynności, bez pokazania zmiany, którą wywołały."}});expect(teaser).not.toHaveProperty("document");expect(teaser).not.toHaveProperty("summary");expect(teaser).not.toHaveProperty("issues");expect(teaser).not.toHaveProperty("strengths");expect(JSON.stringify(teaser)).not.toContain("Zakres ownershipu jest niejasny");expect(JSON.stringify(teaser)).not.toContain("Przepisz 2–3")});
  it("does not let a low-confidence critical issue displace a well-evidenced issue and redacts contact details",()=>{const report=createMockReport();report.issues[0].confidence="low";report.issues[2].evidenceRefs=["seg_exp_1"];report.evidenceMap={...report.evidenceMap,seg_exp_1:"Contact john@example.com or +48 600 123 456. Built checkout flows."};const featured=featuredFreeIssue(report);expect(featured?.title).toBe("Najmocniejszy projekt jest za nisko");expect(featured?.evidence).not.toContain("john@example.com");expect(featured?.evidence).not.toContain("600 123 456")});
  it("drops unsupported evidence",()=>{const input=createMockReport();input.recruiterPerspective.positiveSignals[1].evidenceRefs=["seg_not_supplied"];const report=validateEvidence(input,new Set(["seg_exp_1"]));expect(report.strengths.every(s=>s.evidenceRefs.every(r=>r==="seg_exp_1"))).toBe(true);expect(report.issues.some(i=>i.id==="i3")).toBe(false);expect(report.recruiterPerspective.positiveSignals).toHaveLength(1);expect(report.recruiterPerspective.reservations.some(item=>item.kind==="gap")).toBe(true)});
  it("normalizes GAP findings to an absence of supporting evidence",()=>{const input=createMockReport();input.issues[0].suggestion={type:"gap",original:null,proposed:null,factualityNote:"Brak dowodu w CV."};input.issues[0].evidenceRefs=["seg_exp_1"];input.recruiterPerspective.reservations[0].kind="gap";input.recruiterPerspective.reservations[0].evidenceRefs=["seg_exp_1"];const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].evidenceRefs).toEqual([]);expect(report.recruiterPerspective.reservations[0].evidenceRefs).toEqual([])});
  it("turns an unanchored rewrite into a question and keeps the action aligned",()=>{const input=createMockReport();input.issues[0].action="Rewrite";input.issues[0].suggestion={type:"rewrite",original:"",proposed:"Nowa treść",factualityNote:""};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.type).toBe("question");expect(report.issues[0].suggestion?.proposed).toBeNull();expect(report.issues[0].action).not.toMatch(/^Rewrite$/i);expect(report.issues[0].action).toContain("Doprecyzuj")});
  it("regenerates an already concrete rewrite action once the guard downgrades it to a question",()=>{const input=createMockReport();input.issues[0].action="Przepisz opis biblioteki komponentów tak, aby oddzielić Twój wkład od późniejszego współdzielenia odpowiedzialności.";input.issues[0].suggestion={type:"rewrite",original:"",proposed:"Nowa treść",factualityNote:""};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.type).toBe("question");expect(report.issues[0].action).not.toMatch(/^Przepisz/);expect(report.issues[0].action).toContain("Doprecyzuj brakujące fakty")});
  it("never renders a proposed-text box for a GAP, even if the model returns stray punctuation",()=>{const input=createMockReport();input.issues[0].suggestion={type:"gap",original:null,proposed:".",factualityNote:"Brak dowodu w CV."};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.proposed).toBeNull()});
  it("drops meaningless proposed text on a rewrite instead of showing an empty quote",()=>{const input=createMockReport();input.issues[0].suggestion={type:"rewrite",original:input.evidenceMap!.seg_exp_1,proposed:" . ",factualityNote:""};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.proposed).toBeNull()});
  it("turns a semantically novel expose suggestion into a question",()=>{const input=createMockReport();input.issues[0].suggestion={type:"expose",original:"Implementowałem zadania w React.",proposed:"Prowadziłem inicjatywy architektoniczne, mentoring i współpracę produktową.",factualityNote:"Wymaga potwierdzenia."};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.type).toBe("question");expect(report.issues[0].suggestion?.proposed).toBeNull()});
  it("turns a fill-in placeholder expose suggestion into a question",()=>{const input=createMockReport();input.issues[0].suggestion={type:"expose",original:"Built accessible React interfaces.",proposed:"Built accessible React interfaces, improving [gap].",factualityNote:"Fill this with a real result."};const report=validateEvidence(input,new Set(["seg_exp_1"]),input.evidenceMap);expect(report.issues[0].suggestion?.type).toBe("question");expect(report.issues[0].suggestion?.proposed).toBeNull()});
  it("hydrates recruiter perspective for reports generated before v2",()=>{const legacy=createMockReport() as Partial<CVReport>;delete legacy.recruiterPerspective;const hydrated=withRecruiterPerspective(legacy as CVReport);expect(hydrated.recruiterPerspective.profileSummary).toBe(hydrated.summary.oneSentenceVerdict);expect(hydrated.recruiterPerspective.likelyInterviewQuestions.length).toBeGreaterThan(0)});
});

describe("featured free finding", () => {
  it("follows the model's impact ordering rather than whichever quote is longest", () => {
    const report = createMockReport();
    const evidenceMap = { seg_short: "Krótki, ale najważniejszy dowód z CV.", seg_long: `Znacznie dłuższy cytat z CV, ${"x".repeat(120)}` };
    report.evidenceMap = evidenceMap;
    report.issues = [
      { ...report.issues[0], id: "top", severity: "important", confidence: "high", category: "impact", title: "Najważniejszy problem", evidenceRefs: ["seg_short"] },
      { ...report.issues[0], id: "later", severity: "important", confidence: "high", category: "clarity", title: "Mniej ważny problem", evidenceRefs: ["seg_long"] },
    ];
    expect(featuredFreeIssue(report)?.title).toBe("Najważniejszy problem");
  });

  it("still prefers a materially worse issue over the model's ordering", () => {
    const report = createMockReport();
    report.evidenceMap = { seg_a: "Dowód pierwszy, wystarczająco długi.", seg_b: "Dowód drugi, wystarczająco długi." };
    report.issues = [
      { ...report.issues[0], id: "minor-first", severity: "minor", confidence: "high", category: "clarity", title: "Drobny", evidenceRefs: ["seg_a"] },
      { ...report.issues[0], id: "critical-later", severity: "critical", confidence: "high", category: "impact", title: "Krytyczny", evidenceRefs: ["seg_b"] },
    ];
    expect(featuredFreeIssue(report)?.title).toBe("Krytyczny");
  });
});
