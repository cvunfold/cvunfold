import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAccessToken, hashToken } from "@/lib/security/tokens";

export const SCHOOL_COOKIE = "cvunfold_school_session";
export const PKCE_COOKIE = "cvunfold_school_pkce";
const AUTH_STORAGE_KEY = "cvunfold-school-auth";
export const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" };
export type SchoolMember = { userId: string; schoolId: string; schoolName: string };
export class SchoolError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function schoolDatabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new SchoolError(503, "Panel szkoły nie jest jeszcze skonfigurowany.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

// Only the PKCE verifier is persisted. Supabase access/refresh tokens never enter browser storage.
export function schoolAuth(verifier: string | null = null) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new SchoolError(503, "Logowanie szkoły nie jest jeszcze skonfigurowane.");
  let value = verifier;
  const verifierKey = `${AUTH_STORAGE_KEY}-code-verifier`;
  const client = createClient(url, key, { auth: {
    flowType: "pkce", storageKey: AUTH_STORAGE_KEY, persistSession: true,
    autoRefreshToken: false, detectSessionInUrl: false,
    storage: {
      getItem: (key) => key === verifierKey ? value : null,
      setItem: (key, item) => { if (key === verifierKey) value = item; },
      removeItem: (key) => { if (key === verifierKey) value = null; },
    },
  } });
  return { client, verifier: () => value };
}

export function cookieValue(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie")?.split(";").find(pair => pair.trim().startsWith(`${name}=`));
  if (!raw) return null;
  try { return decodeURIComponent(raw.trim().slice(name.length + 1)); } catch { return null; }
}

export function setSchoolCookie(response: NextResponse, name: string, value: string, maxAge: number) {
  response.cookies.set(name, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}

export function requireSameOrigin(request: Request) {
  const internalUrl = new URL(request.url);
  // Next can reconstruct request.url using its internal hostname (localhost).
  // The browser's actual request Host must still match Origin exactly.
  const host = request.headers.get("host") || internalUrl.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || internalUrl.protocol.slice(0, -1);
  let expectedOrigin = "";
  try { if (protocol === "http" || protocol === "https") expectedOrigin = new URL(`${protocol}://${host}`).origin; } catch { /* fail closed */ }
  if (!expectedOrigin || request.headers.get("origin") !== expectedOrigin) throw new SchoolError(403, "Odśwież stronę i spróbuj ponownie.");
}

export async function requireSchool(request: Request): Promise<SchoolMember> {
  const token = cookieValue(request, SCHOOL_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new SchoolError(401, "Zaloguj się do panelu szkoły.");
  const db = schoolDatabase();
  const { data: session, error } = await db.from("school_sessions").select("user_id")
    .eq("token_hash", hashToken(token)).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new SchoolError(503, "Nie można teraz zweryfikować dostępu.");
  if (!session) throw new SchoolError(401, "Sesja wygasła. Zaloguj się ponownie.");
  return memberForUser(String(session.user_id));
}

export async function memberForUser(userId: string): Promise<SchoolMember> {
  const { data, error } = await schoolDatabase().from("school_members").select("school_id,schools(name)")
    .eq("user_id", userId).maybeSingle();
  if (error) throw new SchoolError(503, "Nie można teraz zweryfikować dostępu.");
  if (!data) throw new SchoolError(403, "Nie masz dostępu do panelu szkoły.");
  const school = (Array.isArray(data.schools) ? data.schools[0] : data.schools) as { name: string } | null;
  if (!school) throw new SchoolError(403, "Nie masz dostępu do panelu szkoły.");
  return { userId, schoolId: String(data.school_id), schoolName: school.name };
}

export async function issueSchoolSession(userId: string) {
  const token = createAccessToken();
  const { error } = await schoolDatabase().from("school_sessions").insert({
    token_hash: hashToken(token), user_id: userId, expires_at: new Date(Date.now() + 8 * 3_600_000).toISOString(),
  });
  if (error) throw new SchoolError(503, "Nie udało się rozpocząć sesji.");
  return token;
}

export async function requireSchoolGroup(request: Request, groupId: string) {
  const member = await requireSchool(request);
  const { data, error } = await schoolDatabase().from("school_groups").select("id,name,target_role,target_seniority")
    .eq("id", groupId).eq("school_id", member.schoolId).maybeSingle();
  if (error) throw new SchoolError(503, "Nie udało się odczytać grupy.");
  if (!data) throw new SchoolError(404, "Nie znaleziono grupy.");
  return { member, group: data };
}

export function schoolFailure(error: unknown) {
  return NextResponse.json({ error: error instanceof SchoolError ? error.message : "Panel jest chwilowo niedostępny. Spróbuj ponownie." },
    { status: error instanceof SchoolError ? error.status : 503, headers: privateHeaders });
}
