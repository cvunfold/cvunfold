import { NextResponse } from "next/server";
import { parseDocument } from "@/lib/document-parsing";
import { detectSeniority } from "@/lib/seniority-detection";
import { detectTargetRole } from "@/lib/role-detection";
import { hmacIdentifier } from "@/lib/security/tokens";
import { rateLimit } from "@/lib/security/rate-limit";
import { validateSignature, validateUpload } from "@/lib/security/upload";

export const runtime = "nodejs";

// Prefills the target role right after the file is chosen, before the visitor
// commits to the analysis. Everything here is transient: the document is parsed
// in memory, the detector is pure string matching, and nothing is written — no
// analysis row, no funnel event, no log line carrying document text. The answer
// is a role enum plus a confidence flag and an optional career-stage enum.
//
// Deliberately separate from /api/analyses. That route creates a paid-path
// artefact and consumes the analysis quota; this one must stay cheap enough to
// run on every file pick, including the picks that never become an analysis.

// Parsing is cheap next to a model call but not free, and this endpoint runs
// before Turnstile has a token to check, so the IP quota is its own and is the
// only thing standing between it and a scripted parse loop.
const DETECTION_LIMIT = 12;
const DETECTION_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const clientIp = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")?.split(",")[0]
    || "local";
  // Its own key namespace: a file pick must never eat into the visitor's
  // remaining analysis attempts.
  if (!rateLimit(hmacIdentifier(`detect-role:${clientIp}`), DETECTION_LIMIT, DETECTION_WINDOW_MS)) {
    return NextResponse.json({ detected: false }, { status: 429, headers: { "Retry-After": "60" } });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ detected: false });
    validateUpload(file);
    await validateSignature(file);
    const parsed = await parseDocument(file);
    const detection = detectTargetRole(parsed.text);
    const stage = detectSeniority(parsed.text);
    return NextResponse.json({ detected: detection.confident, ...(detection.confident ? { role: detection.role } : {}), seniority: stage.seniority });
  } catch {
    // Every failure is the same non-answer. This is a convenience prefill: an
    // unreadable file, a wrong signature or a parser error must leave the form
    // exactly as the visitor left it and surface at submit, where the analysis
    // route already returns a specific, translated message for each cause.
    return NextResponse.json({ detected: false });
  }
}
