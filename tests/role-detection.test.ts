import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectTargetRole } from "@/lib/role-detection";
import { parseTargetRoleId } from "@/lib/roles";

type DetectionCase = {
  id: string;
  expected: string;
  confident: boolean;
  signal: string;
  text: string;
};

const cases: DetectionCase[] = JSON.parse(
  readFileSync(new URL("../fixtures/role-detection-cases.json", import.meta.url), "utf8"),
).cases;

describe("deterministic role detection", () => {
  it("keeps every fixture label inside the closed role set", () => {
    for (const item of cases) expect(parseTargetRoleId(item.expected), item.id).toBe(item.expected);
  });

  it.each(cases)("$id — $signal", ({ expected, confident, text }) => {
    const detection = detectTargetRole(text);
    expect(detection.role).toBe(expected);
    expect(detection.confident).toBe(confident);
  });

  it("declines rather than guessing when the document claims two roles", () => {
    const detection = detectTargetRole("Frontend Developer and Backend Developer, both roles held simultaneously.");
    expect(detection.confident).toBe(false);
    expect(detection.role).toBe("other");
  });

  it("does not let a stuffed skill list outrank the stated title", () => {
    const stuffed = detectTargetRole(
      "Frontend Developer. Skills: Kubernetes, Terraform, Ansible, Helm, Jenkins, Prometheus, Grafana, Selenium, Cypress, Playwright, Appium.",
    );
    expect(stuffed.role).toBe("frontend_developer");
  });

  it("folds Polish diacritics before matching", () => {
    expect(detectTargetRole("Inżynier testów, plan testów i testy regresji.").role).toBe("qa_test_automation");
  });

  it("is a pure function of the text", () => {
    const text = "Backend Developer working with Spring Boot, Postgres and Kafka.";
    expect(detectTargetRole(text)).toEqual(detectTargetRole(text));
  });

  it("reaches the accuracy the detector is allowed to ship at", () => {
    const hits = cases.filter((item) => detectTargetRole(item.text).role === item.expected).length;
    expect(hits).toBe(cases.length);
  });
});
