export function expectedStripeLivemode(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_TARGET_ENV === "production";
}

export function assertStripeLivemode(livemode: boolean): void {
  if (typeof livemode !== "boolean" || livemode !== expectedStripeLivemode()) throw new Error("STRIPE_ENVIRONMENT_MISMATCH");
}

export function assertStripeKeyEnvironment(key: string): void {
  const match = /^(?:sk|rk)_(test|live)_/.exec(key);
  if (!match) throw new Error("STRIPE_KEY_INVALID");
  assertStripeLivemode(match[1] === "live");
}
