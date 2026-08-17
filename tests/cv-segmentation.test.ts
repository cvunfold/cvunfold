import { describe, expect, it } from "vitest";
import { createSegments } from "@/lib/document-parsing";

// The PDF renderer emits one newline per visual line, so every fixture here is
// joined the same way a real extracted CV reaches createSegments.
const page = (...lines: string[]) => lines.join("\n");

describe("cv segmentation", () => {
  it("gives each bullet its own segment instead of one page-sized block", () => {
    const segments = createSegments(page(
      "PROFESSIONAL EXPERIENCE",
      "Senior Frontend Engineer",
      "•Led frontend delivery for a checkout redesign.",
      "•Designed and rolled out a shared component library.",
      "•Planned and delivered the migration of the checkout area.",
    ));
    expect(segments.map((segment) => segment.text)).toEqual([
      "PROFESSIONAL EXPERIENCE Senior Frontend Engineer",
      "Led frontend delivery for a checkout redesign.",
      "Designed and rolled out a shared component library.",
      "Planned and delivered the migration of the checkout area.",
    ]);
  });

  it("treats a dash bullet as a boundary but leaves a date range intact", () => {
    const segments = createSegments(page(
      "- Built and maintained a fleet-management dashboard.",
      "- Introduced Playwright coverage for critical flows.",
      "Southern Coast University",
      "2014 - 2017",
    ));
    expect(segments.map((segment) => segment.text)).toEqual([
      "Built and maintained a fleet-management dashboard.",
      "Introduced Playwright coverage for critical flows.",
      "Southern Coast University 2014 - 2017",
    ]);
  });

  it("keeps a bullet that wraps across visual lines in a single segment", () => {
    const segments = createSegments(page(
      "•Reduced LCP on the mobile booking flow from 4.3s to 2.4s and mobile",
      "booking abandonment by 11% through route-level code splitting.",
    ));
    expect(segments.map((segment) => segment.text)).toEqual([
      "Reduced LCP on the mobile booking flow from 4.3s to 2.4s and mobile booking abandonment by 11% through route-level code splitting.",
    ]);
  });

  it("still splits on blank lines and sentence boundaries", () => {
    const segments = createSegments("Frontend Developer. Built React views.\n\nCreated a Web Vitals dashboard.");
    expect(segments.map((segment) => segment.text)).toEqual([
      "Frontend Developer.",
      "Built React views.",
      "Created a Web Vitals dashboard.",
    ]);
  });
});
