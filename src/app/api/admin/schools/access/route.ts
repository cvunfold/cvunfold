import { NextResponse } from "next/server";
import { z } from "zod";
import { constantTimeEqual } from "@/lib/security/tokens";
import { rateLimit } from "@/lib/security/rate-limit";
import { runtimeEnvironmentFrom } from "@/lib/runtime-environment";
import { changeInvoiceAccess, invoiceAccessChange, readInvoiceAccess } from "@/lib/schools/invoice-access";
import { privateHeaders, requireSameOrigin, SchoolError, schoolFailure } from "@/lib/schools/server";

export const dynamic = "force-dynamic";
function requireOwner(request: Request) {
  const expected = process.env.ADMIN_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || expected.length < 32 || !received || !constantTimeEqual(expected, received)) throw new SchoolError(401, "Unauthorized");
  if (request.headers.has("origin")) requireSameOrigin(request);
}
function environment() {
  let databaseRef: string | null = null;
  try { const hostname = new URL(process.env.SUPABASE_URL || "").hostname; if (hostname.endsWith(".supabase.co")) databaseRef = hostname.split(".")[0]; } catch { /* no configured database */ }
  return { environment: runtimeEnvironmentFrom(), databaseRef };
}
export async function GET(request: Request) {
  try {
    requireOwner(request);
    const id = new URL(request.url).searchParams.get("schoolId");
    if (!z.string().uuid().safeParse(id).success) throw new SchoolError(400, "Podaj identyfikator szkoły.");
    return NextResponse.json({ ...environment(), ...await readInvoiceAccess(id!) }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
export async function POST(request: Request) {
  try {
    requireOwner(request);
    const target = environment();
    if (!target.databaseRef || request.headers.get("x-cvunfold-environment") !== target.environment || request.headers.get("x-cvunfold-database-ref") !== target.databaseRef) throw new SchoolError(409, "Środowisko lub baza nie odpowiada potwierdzonemu celowi aktywacji.");
    if (!rateLimit("owner-school-access", 20, 60_000)) throw new SchoolError(429, "Spróbuj ponownie za chwilę.");
    const raw = await request.text();
    if (raw.length > 4096) throw new SchoolError(400, "Niepoprawna zmiana dostępu.");
    let body: unknown; try { body = JSON.parse(raw); } catch { throw new SchoolError(400, "Niepoprawna zmiana dostępu."); }
    const parsed = invoiceAccessChange.safeParse(body);
    if (!parsed.success) throw new SchoolError(400, "Podaj szkołę, numer faktury, datę końca dostępu i identyfikator żądania.");
    return NextResponse.json({ ...environment(), ...await changeInvoiceAccess(parsed.data) }, { headers: privateHeaders });
  } catch (error) { return schoolFailure(error); }
}
