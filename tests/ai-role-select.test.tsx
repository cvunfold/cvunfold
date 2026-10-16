// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RoleSelect } from "@/components/role-select";

afterEach(cleanup);
for (const locale of ["pl", "en"] as const) it(`discloses the AI pilot without calling it a generic analysis in ${locale}`, () => {
  render(<RoleSelect value="ai_automation_specialist" onChange={vi.fn()} locale={locale}/>);
  expect(screen.getByRole("combobox").textContent).toContain("AI Automation Specialist");
  expect(screen.getByRole("note").textContent).toContain(locale === "pl" ? "pilotażu" : "pilot");
  expect(screen.getByRole("note").textContent).not.toMatch(/kryteriów ogólnych|general criteria/);
});
