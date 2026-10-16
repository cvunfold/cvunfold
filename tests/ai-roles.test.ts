import { describe, expect, it } from "vitest";
import { AI_SAMPLE_ROLES, createAiRoleSample } from "@/lib/ai/ai-role-samples";
import { getReviewPrompt, REVIEW_PROMPT_VARIANTS } from "@/lib/ai/prompts";
import { aiRolePolicy } from "@/lib/ai/ai-role-policy";
import { detectTargetRole } from "@/lib/role-detection";
import { evaluateLiveReport, evaluateLocaleParity, type LiveEvalCase } from "@/lib/ai/live-eval";
import { evaluateCareerQuality } from "@/lib/ai/career-quality";
import cases from "../fixtures/ai-role-eval-cases.json";

describe("AI role quality", () => {
  for (const role of AI_SAMPLE_ROLES) it(`provides fact-safe equivalent PL/EN examples for ${role}`, () => {
    const reports = ["pl", "en"].map(locale => {
      const report = createAiRoleSample(role, locale as "pl" | "en");
      expect(Object.values(report.evidenceMap!)).toContain(cases.find(item => item.id === (role === "ai_llm_engineer" ? "ai-llm-strong" : "ai-automation-strong"))!.cv[locale as "pl" | "en"]);
      const segments = Object.entries(report.evidenceMap!).map(([id, text]) => ({ id, text }));
      expect(evaluateLiveReport(report, segments, locale as "pl" | "en").filter(check => !check.pass)).toEqual([]);
      expect(JSON.stringify(report)).not.toMatch(/React|Frontend|booking|rezerwacji|planer/i);
      expect(report.promptVersion).toContain(`roles-v2.0.0:${role}`);
      return report;
    });
    expect(evaluateLocaleParity(reports[0], reports[1]).filter(check => !check.pass)).toEqual([]);
  });

  it("keeps existing role prompts unchanged and adds AI rules in both languages", () => {
    for (const locale of ["pl", "en"] as const) {
      expect(aiRolePolicy("frontend_developer", locale)).toBe("");
      expect(getReviewPrompt(locale, "junior", "standard", "frontend_developer")).toEqual(getReviewPrompt(locale, "junior", "standard"));
      for (const role of AI_SAMPLE_ROLES) {
        expect(getReviewPrompt(locale, "first_job", "first_job", role).systemPrompt).toContain(aiRolePolicy(role, locale));
      }
    }
    expect(REVIEW_PROMPT_VARIANTS.length).toBeGreaterThan(0);
  });

  it("detects AI titles without turning AI tool users into AI engineers", () => {
    expect(detectTargetRole("AI / LLM Engineer. Python, RAG, LangChain, vector database").role).toBe("ai_llm_engineer");
    expect(detectTargetRole("AI Automation Specialist. n8n, Dify, Make.com").role).toBe("ai_automation_specialist");
    expect(detectTargetRole("Frontend Developer. React, TypeScript, CSS. I use ChatGPT and Copilot.").role).toBe("frontend_developer");
    expect(detectTargetRole("I use ChatGPT and Copilot to write emails.").confident).toBe(false);
  });

  it("rejects advice that forces coding onto a strong no-code profile", () => {
    const report = createAiRoleSample("ai_automation_specialist", "en");
    const expected = (cases as LiveEvalCase[]).find(item => item.id === "ai-automation-strong")!.careerQuality!;
    report.issues[0].action = "Add Python to make your workflow credible.";
    expect(evaluateCareerQuality(report, expected).some(check => !check.pass)).toBe(true);
  });

  it("covers strong, guided, tools-only and API-only profiles with matched languages", () => {
    expect(cases).toHaveLength(6);
    for (const item of cases) {
      expect(item.cv.pl.length).toBeGreaterThan(120);
      expect(item.cv.en.length).toBeGreaterThan(120);
      expect(item.targetSeniority).toBe("first_job");
    }
  });
});
