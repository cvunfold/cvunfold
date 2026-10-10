import { describe, expect, it } from "vitest";
import { auditCalibration } from "@/lib/ai/validate-report";
import { getReviewPrompt } from "@/lib/ai/prompts";
import { RUBRIC_CATEGORY_KEYS, type RubricCategoryKey } from "@/lib/ai/schemas/report";

const scores = (overrides: Record<string, number>) =>
  RUBRIC_CATEGORY_KEYS.map((key) => ({ key, label: key, weight: 1 / RUBRIC_CATEGORY_KEYS.length, score: overrides[key] ?? 70, rationale: "", evidenceRefs: [] }));

const issue = (category: RubricCategoryKey, severity: "minor" | "important" | "critical") => ({
  id: `i-${category}-${severity}`, severity, category, title: "", explanation: "", whyItMatters: "",
  evidenceRefs: [], confidence: "high" as const, action: "", suggestion: null,
});

describe("calibration audit", () => {
  it("flags a category scored above the important cap", () => {
    // The real gpt-5.4-mini run: important ownership issue, ownership scored 86.
    const violations = auditCalibration({ categoryScores: scores({ ownership: 86 }), issues: [issue("ownership", "important")] });
    expect(violations).toEqual([{ category: "ownership", score: 86, severity: "important", cap: 79 }]);
  });

  it("accepts a category held at or below the cap", () => {
    expect(auditCalibration({ categoryScores: scores({ ownership: 79 }), issues: [issue("ownership", "important")] })).toEqual([]);
  });

  it("ignores minor issues, which carry no cap", () => {
    expect(auditCalibration({ categoryScores: scores({ clarity: 95 }), issues: [issue("clarity", "minor")] })).toEqual([]);
  });

  it("applies the stricter critical cap when a category has both", () => {
    const violations = auditCalibration({
      categoryScores: scores({ impact: 70 }),
      issues: [issue("impact", "important"), issue("impact", "critical")],
    });
    expect(violations).toEqual([{ category: "impact", score: 70, severity: "critical", cap: 65 }]);
  });

  it("reports nothing when no issue targets a scored category", () => {
    expect(auditCalibration({ categoryScores: scores({ impact: 99 }), issues: [] })).toEqual([]);
  });
});

describe("v1.6-rc3 prompt", () => {
  it("keeps rc2's calibration procedure", () => {
    const original = process.env.CV_REVIEW_PROMPT_VARIANT;
    process.env.CV_REVIEW_PROMPT_VARIANT = "v1.6-rc3";
    try {
      const resolved = getReviewPrompt("pl");
      expect(resolved.variant).toBe("v1.6-rc3");
      expect(resolved.version).toBe("v1.6-rc3+career-v2.2.0:auto");
      expect(resolved.systemPrompt).toContain("KALIBRACJA SCORE — PROCEDURA OBOWIĄZKOWA");
      expect(resolved.systemPrompt).not.toContain("ats.findings");
    } finally {
      if (original === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
      else process.env.CV_REVIEW_PROMPT_VARIANT = original;
    }
  });
});

describe("v1.6-rc2 prompt", () => {
  it("is selectable and reports its own version", () => {
    const original = process.env.CV_REVIEW_PROMPT_VARIANT;
    process.env.CV_REVIEW_PROMPT_VARIANT = "v1.6-rc2";
    try {
      const resolved = getReviewPrompt("pl");
      expect(resolved.variant).toBe("v1.6-rc2");
      expect(resolved.version).toBe("v1.6-rc2+career-v2.2.0:auto");
      // rc2 is rc1 plus the mandatory calibration procedure.
      expect(resolved.systemPrompt).toContain("KALIBRACJA SCORE — PROCEDURA OBOWIĄZKOWA");
      expect(resolved.systemPrompt).toContain("domyślnym maksimum jest 79");
      expect(resolved.systemPrompt.length).toBeGreaterThan(getReviewPromptFor("v1.6-rc1").length);
    } finally {
      if (original === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
      else process.env.CV_REVIEW_PROMPT_VARIANT = original;
    }
  });
});

function getReviewPromptFor(variant: string): string {
  const previous = process.env.CV_REVIEW_PROMPT_VARIANT;
  process.env.CV_REVIEW_PROMPT_VARIANT = variant;
  const prompt = getReviewPrompt("pl").systemPrompt;
  if (previous === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
  else process.env.CV_REVIEW_PROMPT_VARIANT = previous;
  return prompt;
}

describe("English review prompt", () => {
  const withVariant = (variant: string | undefined, run: () => void) => {
    const original = process.env.CV_REVIEW_PROMPT_VARIANT;
    if (variant === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
    else process.env.CV_REVIEW_PROMPT_VARIANT = variant;
    try { run(); } finally {
      if (original === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
      else process.env.CV_REVIEW_PROMPT_VARIANT = original;
    }
  };

  it("stays on the stable EN prompt for rc1 and rc2, isolating the Polish canary", () => {
    for (const variant of ["v1.6-rc1", "v1.6-rc2"]) {
      withVariant(variant, () => {
        const resolved = getReviewPrompt("en");
        expect(resolved.variant).toBe("stable");
        expect(resolved.version).toBe("review-en-v1.4.0+career-v2.2.0:auto");
      });
    }
  });

  it("switches to review-en-v2 once the candidate reaches rc3", () => {
    withVariant("v1.6-rc3", () => {
      const resolved = getReviewPrompt("en");
      expect(resolved.variant).toBe("v1.6-rc3");
      expect(resolved.version).toBe("review-en-v2.0.0+career-v2.2.0:auto");
      expect(resolved.systemPrompt).toContain("MANDATORY SCORE CALIBRATION PROCEDURE");
    });
  });

  it("keeps PL on rc3 and EN on v2 simultaneously, not one overwriting the other", () => {
    withVariant("v1.6-rc3", () => {
      expect(getReviewPrompt("pl").version).toBe("v1.6-rc3+career-v2.2.0:auto");
      expect(getReviewPrompt("en").version).toBe("review-en-v2.0.0+career-v2.2.0:auto");
    });
  });

  it("defaults both locales to their stable prompt outside any variant", () => {
    withVariant(undefined, () => {
      expect(getReviewPrompt("pl").variant).toBe("stable");
      expect(getReviewPrompt("en").variant).toBe("stable");
    });
  });
});

describe("v1.6-rc4 prompt", () => {
  it("keeps rc3 intact and adds the EXPOSE attribution rule for both locales", () => {
    const original = process.env.CV_REVIEW_PROMPT_VARIANT;
    process.env.CV_REVIEW_PROMPT_VARIANT = "v1.6-rc4";
    try {
      const pl = getReviewPrompt("pl");
      expect(pl.version).toBe("v1.6-rc4.1+career-v2.2.0:auto");
      expect(pl.systemPrompt).toContain("KALIBRACJA SCORE — PROCEDURA OBOWIĄZKOWA");
      expect(pl.systemPrompt).toContain("zachowaj jego przypisanie do pracodawcy i okresu zatrudnienia");

      const en = getReviewPrompt("en");
      expect(en.version).toBe("review-en-v3.1.0+career-v2.2.0:auto");
      expect(en.systemPrompt).toContain("MANDATORY SCORE CALIBRATION PROCEDURE");
      expect(en.systemPrompt).toContain("preserve its employer and time-period attribution");
    } finally {
      if (original === undefined) delete process.env.CV_REVIEW_PROMPT_VARIANT;
      else process.env.CV_REVIEW_PROMPT_VARIANT = original;
    }
  });
});
