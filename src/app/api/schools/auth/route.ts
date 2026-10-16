import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAnalysisQuota, rateLimit } from "@/lib/security/rate-limit";
import { hashToken, hmacIdentifier } from "@/lib/security/tokens";
import { cookieValue, issueSchoolSession, memberForUser, PKCE_COOKIE, privateHeaders, requireSameOrigin, SCHOOL_COOKIE, schoolAuth, schoolDatabase, SchoolError, schoolFailure, setSchoolCookie } from "@/lib/schools/server";

export const runtime = "nodejs";
const input = z.object({ email: z.string().trim().email().max(254) });
const accepted = "Jeśli masz przyznany dostęp, otrzymasz link na e-mail. Otwórz go w tej samej przeglądarce.";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = input.safeParse(await request.json());
    if (!body.success) throw new SchoolError(400, "Wpisz poprawny adres e-mail.");
    const email = body.data.email.toLowerCase();
    const subject = hmacIdentifier(`school-login:${request.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`);
    if (!rateLimit(subject, 3) || !(await consumeAnalysisQuota(subject, 6, 20)).allowed
      || !(await consumeAnalysisQuota(hmacIdentifier(`school-email:${email}`), 3, 10)).allowed) throw new SchoolError(429, "Zbyt wiele prób. Spróbuj później.");
    const db = schoolDatabase();
    const { data, error } = await db.from("school_members").select("user_id").eq("email", email).maybeSingle();
    if (error) throw new SchoolError(503, "Logowanie jest chwilowo niedostępne.");
    const response = NextResponse.json({ message: accepted }, { headers: privateHeaders });
    if (data) {
      // Same-origin validation above makes the Preview callback follow the
      // deployment that started PKCE, rather than a different deployment URL.
      const origin = process.env.VERCEL_ENV === "preview"
        ? request.headers.get("origin")
        : process.env.SCHOOLS_APP_URL || process.env.NEXT_PUBLIC_SCHOOLS_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!origin || (process.env.NODE_ENV === "production" && !origin.startsWith("https://"))) throw new SchoolError(503, "Logowanie nie jest jeszcze skonfigurowane.");
      if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview" && new URL(origin).origin !== request.headers.get("origin")) throw new SchoolError(403, "Otwórz panel szkoły pod właściwym adresem i poproś o link ponownie.");
      const auth = schoolAuth();
      const { error: authError } = await auth.client.auth.signInWithOtp({ email, options: {
        shouldCreateUser: false, emailRedirectTo: new URL("/dla-szkol/potwierdz", origin).toString(),
      } });
      if (authError || !auth.verifier()) throw new SchoolError(503, "Nie udało się wysłać linku. Spróbuj później.");
      setSchoolCookie(response, PKCE_COOKIE, auth.verifier()!, 600);
    }
    return response;
  } catch (error) { return schoolFailure(error); }
}

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const body = z.object({ code: z.string().min(10).max(512) }).safeParse(await request.json());
    const verifier = cookieValue(request, PKCE_COOKIE);
    if (!body.success || !verifier) throw new SchoolError(400, "Link wygasł lub został otwarty w innej przeglądarce. Poproś o nowy.");
    const auth = schoolAuth(verifier);
    const { data, error } = await auth.client.auth.exchangeCodeForSession(body.data.code);
    if (error || !data.session) throw new SchoolError(400, "Link jest nieważny lub został już użyty. Poproś o nowy.");
    const { data: verified, error: verifyError } = await auth.client.auth.getUser(data.session.access_token);
    if (verifyError || !verified.user) throw new SchoolError(401, "Nie udało się potwierdzić logowania.");
    const member = await memberForUser(verified.user.id);
    const token = await issueSchoolSession(member.userId);
    const response = NextResponse.json({ ok: true }, { headers: privateHeaders });
    setSchoolCookie(response, SCHOOL_COOKIE, token, 8 * 3600);
    setSchoolCookie(response, PKCE_COOKIE, "", 0);
    return response;
  } catch (error) { return schoolFailure(error); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    const token = cookieValue(request, SCHOOL_COOKIE);
    if (token) {
      const { error } = await schoolDatabase().from("school_sessions").delete().eq("token_hash", hashToken(token));
      if (error) throw new SchoolError(503, "Nie udało się zakończyć sesji.");
    }
    const response = NextResponse.json({ ok: true }, { headers: privateHeaders });
    setSchoolCookie(response, SCHOOL_COOKIE, "", 0);
    setSchoolCookie(response, PKCE_COOKIE, "", 0);
    return response;
  } catch (error) { return schoolFailure(error); }
}
