import { describe, expect, it } from "vitest";
import { getRubric, scoringSeniority } from "@/lib/rubrics/technical-v1";
import { calculateOverall } from "@/lib/ai/validate-report";

const weightOf = (seniority: Parameters<typeof getRubric>[0], key: string) =>
  getRubric(seniority, "frontend_developer", "pl").find((category) => category.key === key)!.weight;

describe("auto seniority no longer means senior", () => {
  it("stops scoring an undeclared level on senior criteria", () => {
    // The visitor picked "I do not know, judge from my CV". Scoring them as a senior
    // weighted ownership at .23 and clarity at .08 — the two things a junior can
    // least and most act on, in exactly the wrong order.
    expect(weightOf("auto", "ownership")).not.toBe(weightOf("senior", "ownership"));
    expect(weightOf("auto", "clarity")).not.toBe(weightOf("senior", "clarity"));
  });

  it("keeps auto between junior and senior rather than at either extreme", () => {
    const auto = weightOf("auto", "ownership");
    expect(auto).toBeGreaterThan(weightOf("junior", "ownership"));
    expect(auto).toBeLessThan(weightOf("senior", "ownership"));
  });

  it("leaves an explicitly declared level untouched", () => {
    expect(weightOf("junior", "ownership")).toBeCloseTo(0.09);
    expect(weightOf("junior", "clarity")).toBeCloseTo(0.30);
    expect(weightOf("senior", "ownership")).toBeCloseTo(0.23);
  });
});

describe("scoring seniority resolved after the model has read the CV", () => {
  it("adopts the perceived level when the visitor did not declare one", () => {
    expect(scoringSeniority("auto", "junior")).toBe("junior");
    expect(scoringSeniority("auto", "lead")).toBe("lead");
  });

  it("keeps neutral weights when the document does not settle the question", () => {
    expect(scoringSeniority("auto", "unclear")).toBe("auto");
    expect(scoringSeniority("auto", "nonsense")).toBe("auto");
  });

  it("never lets a perceived level override an explicit choice", () => {
    // Someone applying up or down a level said so deliberately; the CV they have
    // today is not the level they are aiming at.
    expect(scoringSeniority("junior", "senior")).toBe("junior");
    expect(scoringSeniority("lead", "junior")).toBe("lead");
  });
});

describe("every profile stays a valid rubric", () => {
  it("sums to one, which calculateOverall enforces at runtime", () => {
    for (const seniority of ["auto", "junior", "mid", "senior", "lead"] as const) {
      const categories = getRubric(seniority, "frontend_developer", "pl")
        .map((category) => ({ ...category, score: 50, rationale: "", evidenceRefs: [] }));
      expect(() => calculateOverall(categories)).not.toThrow();
      expect(calculateOverall(categories)).toBe(50);
    }
  });
});
