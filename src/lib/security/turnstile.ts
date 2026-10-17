import { z } from "zod";

const responseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

export type TurnstileAction = "cv_analysis" | "school_contact";

function expectedHostnames(): string[] {
  const configured = process.env.TURNSTILE_EXPECTED_HOSTNAMES ?? process.env.TURNSTILE_EXPECTED_HOSTNAME;
  if (configured === undefined) return [];
  const hosts = configured.split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length || hosts.some(host => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host))) {
    throw new Error("TURNSTILE_UNAVAILABLE");
  }
  return hosts;
}

export async function verifyTurnstile(token: string, remoteIp?: string, action: TurnstileAction = "cv_analysis"): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;
  const hostnames = expectedHostnames();
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
  if (
    !parsed.data.success
    || parsed.data.action !== action
    || (hostnames.length > 0 && (!parsed.data.hostname || !hostnames.includes(parsed.data.hostname.toLowerCase())))
  ) throw new Error("TURNSTILE_FAILED");
}
