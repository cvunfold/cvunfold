import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/security/turnstile";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("accepts a successful token only for the expected action and hostname", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAME = "cvunfold.pl";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "cvunfold.pl",
      action: "cv_analysis",
    }), { status: 200 })));

    await expect(verifyTurnstile("token", "127.0.0.1")).resolves.toBeUndefined();
  });

  it.each([
    { hostname: "attacker.example", action: "cv_analysis" },
    { hostname: "cvunfold.pl", action: "different_action" },
    { hostname: "cvunfold.pl", action: undefined },
  ])("rejects a mismatched hostname or action", async (result) => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAME = "cvunfold.pl";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, ...result }), { status: 200 })));

    await expect(verifyTurnstile("token")).rejects.toThrow("TURNSTILE_FAILED");
  });
});
