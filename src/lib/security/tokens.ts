import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const fallbackSecret = "mock-only-cvunfold-secret-never-production";

export function createAccessToken(): string { return randomBytes(32).toString("base64url"); }
export function hashToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
export function hmacIdentifier(value: string): string {
  return createHmac("sha256", process.env.RATE_LIMIT_HMAC_SECRET || fallbackSecret).update(value).digest("hex");
}
export function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
