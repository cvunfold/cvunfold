import { describe, expect, it } from "vitest";
import nextConfig, { crossOriginOpenerPolicy } from "../next.config";

describe("security headers", () => {
  it("allows Google Pay to keep its checkout popup connected", async () => {
    expect(crossOriginOpenerPolicy).toBe("same-origin-allow-popups");

    const headers = await nextConfig.headers?.();
    const globalHeaders = headers?.find((entry) => entry.source === "/(.*)")?.headers;

    expect(globalHeaders).toContainEqual({
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    });
  });
});
