import { createHmac } from "node:crypto";
import { constantTimeEqual, hashToken } from "./tokens";

export const ACCESS_CODE_COOKIE = "cvunfold_access_code_v1";
export const ACCESS_CODE_SECONDS = 60 * 60;

function configuredCodes(): string[] {
  return (process.env.REPORT_ACCESS_CODES || "").split(",").map(code => code.trim().toLowerCase()).filter(code => code.length >= 4 && code.length <= 128);
}
export function reportAccessCodesEnabled(): boolean {
  const secret = process.env.REPORT_ACCESS_CODE_SECRET || "";
  return process.env.REPORT_ACCESS_CODES_ENABLED === "true" && configuredCodes().length > 0 && secret.length >= 32 && secret.length <= 256;
}
export function validateReportAccessCode(value: unknown): string | null {
  if (!reportAccessCodesEnabled() || typeof value !== "string" || value.length > 128) return null;
  const candidate = hashToken(value.trim().toLowerCase());
  let valid = false;
  for (const code of configuredCodes()) valid = constantTimeEqual(candidate, hashToken(code)) || valid;
  return valid ? candidate : null;
}
function signature(value: string): string {
  return createHmac("sha256", process.env.REPORT_ACCESS_CODE_SECRET!).update(`report-access-code:${value}`).digest("base64url");
}
export function createPendingCodeGrant(codeHash: string): string {
  if (!reportAccessCodesEnabled() || !/^[a-f0-9]{64}$/.test(codeHash)) throw new Error("ACCESS_CODES_DISABLED");
  const payload = `${codeHash}.${Date.now() + ACCESS_CODE_SECONDS * 1000}`;
  return `${payload}.${signature(payload)}`;
}
export function pendingCodeFromRequest(request: Request): string | null {
  if (!reportAccessCodesEnabled()) return null;
  const raw = (request.headers.get("cookie") || "").split(";").map(pair => pair.trim()).find(pair => pair.startsWith(`${ACCESS_CODE_COOKIE}=`))?.slice(ACCESS_CODE_COOKIE.length + 1);
  if (!raw || raw.length > 200) return null;
  const [codeHash, expires, signed, extra] = raw.split(".");
  const deadline = Number(expires);
  if (extra || !/^[a-f0-9]{64}$/.test(codeHash) || !signed || !Number.isFinite(deadline) || deadline <= Date.now() || deadline > Date.now() + ACCESS_CODE_SECONDS * 1000) return null;
  if (!constantTimeEqual(signed, signature(`${codeHash}.${expires}`))) return null;
  return configuredCodes().some(code => constantTimeEqual(hashToken(code), codeHash)) ? codeHash : null;
}

// Persisted server grants survive code withdrawal, like a redeemed voucher.
// The original report expiry and private report session still apply.
export function hasReportCodeAccess(item: { accessCodeHash?: string; accessCodeGrantedAt?: Date; expiresAt: Date; schoolGroupId?: string }): boolean {
  return !item.schoolGroupId && /^[a-f0-9]{64}$/.test(item.accessCodeHash || "")
    && Boolean(item.accessCodeGrantedAt && Number.isFinite(item.accessCodeGrantedAt.getTime())) && item.expiresAt > new Date();
}
