// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SchoolBatchProgress } from "@/components/schools/batch-progress";
afterEach(cleanup);
it("shows a failed upload as a failure rather than a ready-report success", () => {
  render(<SchoolBatchProgress timing={{ averageMs: 120000, sampleCount: 0 }} batches={[{ id: "failed", status: "complete", createdAt: "2026-10-13T09:41:00Z", jobs: [{ id: "cv", name: "Emilia Czech", status: "failed", error: "Plik nie dotarł." }] }]}/>);
  expect(screen.getByRole("heading", { name: "Nie udało się przetworzyć CV" })).toBeTruthy();
  expect(screen.getByText(/Nieudane: 1\. Rozwiń szczegóły/)).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Paczka została przetworzona" })).toBeNull();
});
