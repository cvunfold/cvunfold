import { describe, expect, it } from "vitest";
import { detectSeniority } from "@/lib/seniority-detection";

describe("conservative career-stage detection", () => {
  it.each([
    ["Jan Kowalski\nJunior Frontend Developer\nSzukam pierwszej pracy w IT", "first_job"],
    ["Alex Example\nJunior Backend Developer\n1 year of commercial experience", "junior"],
    ["Mid Software Engineer\n3 lata doświadczenia", "mid"],
    ["Senior Frontend Developer\n6 years of experience", "senior"],
    ["Lead Software Engineer\n10 lat doświadczenia", "lead"],
    ["Senior Frontend Developer\n1 year of experience", null],
    ["6 years of commercial experience\nReact, TypeScript", null],
    ["Bootcamp React, Python, Git", null],
    ["Frontend Developer\nExperience\nSenior Engineer, 2018-2020", null],
    ["Worked with Senior Engineers and team leads", null],
    ["Junior Frontend Developer\nSenior Backend Developer", null],
  ])("detects only a clear declared profile: %s", (text, expected) => {
    expect(detectSeniority(text).seniority).toBe(expected);
  });
  it("reads declared years as corroborating evidence", () => {
    expect(detectSeniority("Senior Software Engineer\n6 lat komercyjnego doświadczenia")).toEqual({ seniority: "senior", declaredYears: 6 });
  });
});
