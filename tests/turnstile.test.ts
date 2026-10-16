import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/security/turnstile";

const originalEnv = { ...process.env };
beforeEach(() => { delete process.env.TURNSTILE_EXPECTED_HOSTNAMES; });

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it.each(["cvunfold.com", "szkoly.cvunfold.com"])("accepts the exact configured host %s", async hostname => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAME = "cvunfold.pl";
    process.env.TURNSTILE_EXPECTED_HOSTNAMES = "cvunfold.com, szkoly.cvunfold.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname, action: "school_contact" }))));
    await expect(verifyTurnstile("token", undefined, "school_contact")).resolves.toBeUndefined();
  });

  it.each(["attacker.cvunfold.com", "cvunfold.com.attacker.example", undefined])("rejects a host outside the exact server allowlist: %s", async hostname => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAMES = "cvunfold.com,szkoly.cvunfold.com";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname, action: "cv_analysis" }))));
    await expect(verifyTurnstile("token")).rejects.toThrow("TURNSTILE_FAILED");
  });

  it.each(["*", "https://cvunfold.com", "cvunfold.com/path", ""]) ("fails closed for invalid hostname configuration %s", async configured => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAMES = configured;
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(verifyTurnstile("token")).rejects.toThrow("TURNSTILE_UNAVAILABLE");
    expect(fetch).not.toHaveBeenCalled();
  });

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
