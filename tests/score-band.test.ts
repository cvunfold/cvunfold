import { describe, expect, it } from "vitest";
import { scoreBand } from "@/components/score-ring";

describe("score band", () => {
  it("does not call a weak document a good direction", () => {
    // The real v1.6-rc2 run that surfaced this: 51/100 rendered as "Dobry kierunek".
    const band = scoreBand(51);
    expect(band.tone).toBe("weak");
    expect(band.pl).not.toBe("Dobry kierunek");
  });

  it.each([
    [92, "strong"],
    [85, "strong"],
    [84, "good"],
    [70, "good"],
    [69, "mixed"],
    [66, "mixed"],
    [55, "mixed"],
    [54, "weak"],
    [40, "weak"],
    [39, "critical"],
    [0, "critical"],
  ])("maps %i to the %s band", (score, tone) => {
    expect(scoreBand(score).tone).toBe(tone);
  });

  it("separates the three scores the same prompt produced on different CVs", () => {
    expect([51, 66, 92].map((score) => scoreBand(score).tone)).toEqual(["weak", "mixed", "strong"]);
  });

  it("offers both languages for every band", () => {
    for (const score of [95, 75, 60, 45, 20]) {
      const band = scoreBand(score);
      expect(band.pl.length).toBeGreaterThan(0);
      expect(band.en.length).toBeGreaterThan(0);
    }
  });
});
