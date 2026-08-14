import { describe, expect, it } from "vitest";
import nextConfig, {
  defaultCrossOriginOpenerPolicy,
  googlePayCrossOriginOpenerPolicy,
} from "../next.config";

describe("security headers", () => {
  it("allows Google Pay popups only on report checkout pages", async () => {
    expect(defaultCrossOriginOpenerPolicy).toBe("same-origin");
    expect(googlePayCrossOriginOpenerPolicy).toBe("same-origin-allow-popups");

    const headers = await nextConfig.headers?.();
    const globalHeaders = headers?.find((entry) => entry.source === "/(.*)")?.headers;
    const polishReportHeaders = headers?.find((entry) => entry.source === "/raport")?.headers;
    const englishReportHeaders = headers?.find((entry) => entry.source === "/en/report")?.headers;

    expect(globalHeaders).toContainEqual({
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    });
    expect(polishReportHeaders).toContainEqual({
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    });
    expect(englishReportHeaders).toContainEqual({
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    });
  });
});
