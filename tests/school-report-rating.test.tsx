// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SchoolReportRating } from "@/components/schools/report-rating";
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("sends the clicked star value for the selected school report version", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetch);
  render(<SchoolReportRating id="synthetic-cv" version={1}/>);
  fireEvent.click(screen.getByRole("radio", { name: "Ocena 3 z 5" }));
  fireEvent.click(screen.getByRole("button", { name: "Wyślij ocenę" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Dziękujemy"));
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ version: 1, rating: 3, accurate: "yes", comment: "", requestId: expect.any(String) });
});
