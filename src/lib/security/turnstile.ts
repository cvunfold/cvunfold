import { z } from "zod";

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

const EXPECTED_ACTION = "cv_analysis";

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  if (!token || token.length > 2048) throw new Error("TURNSTILE_REQUIRED");
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "local") body.set("remoteip", remoteIp);
  let response: Response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(8000), cache: "no-store",
    });
  } catch { throw new Error("TURNSTILE_UNAVAILABLE"); }
  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!response.ok || !parsed.success) throw new Error("TURNSTILE_UNAVAILABLE");
  const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
  if (
    !parsed.data.success
    || parsed.data.action !== EXPECTED_ACTION
    || (expectedHostname && parsed.data.hostname !== expectedHostname)
  ) throw new Error("TURNSTILE_FAILED");
}
