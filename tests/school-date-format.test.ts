import { afterEach, expect, it, vi } from "vitest";
import { schoolDate, schoolDateTime, schoolTime } from "@/lib/schools/date-format";

afterEach(() => vi.unstubAllEnvs());
it("keeps the invoice expiry and queue timestamps identical across server and browser zones", () => {
  const expiry = "2026-10-14T22:00:00Z";
  const results = ["UTC", "Europe/Warsaw", "America/Los_Angeles"].map(zone => {
    vi.stubEnv("TZ", zone);
    return [schoolDate(expiry), schoolDateTime(expiry), schoolTime(Date.parse(expiry))];
  });
  expect(results[0]).toEqual(results[1]);
  expect(results[1]).toEqual(results[2]);
  expect(results[0][0]).toBe("15.10.2026");
  expect(results[0][2]).toBe("00:00");
});
