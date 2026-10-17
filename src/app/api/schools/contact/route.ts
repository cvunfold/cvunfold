import { NextResponse } from "next/server";
import { schoolContactSchema } from "@/lib/schools/offer";
import { schoolContactDeliveryEnabled, sendSchoolContact } from "@/lib/schools/contact-mail";
import { requireSameOrigin, SchoolError, privateHeaders } from "@/lib/schools/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { hmacIdentifier } from "@/lib/security/tokens";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";
const MAX_BYTES = 12_000;

async function readMessage(request: Request) {
  if (!request.body) throw new SchoolError(400, "Uzupełnij formularz.");
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new SchoolError(413, "Wiadomość jest za długa.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new SchoolError(413, "Wiadomość jest za długa."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new SchoolError(400, "Sprawdź dane w formularzu."); }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new SchoolError(415, "Sprawdź formularz i spróbuj ponownie.");
    const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if (!rateLimit(hmacIdentifier(`school-contact:${ip}`), 3, 600_000)) return NextResponse.json({ error: "Odczekaj kilka minut przed kolejną wiadomością." }, { status: 429, headers: { ...privateHeaders, "Retry-After": "600" } });
    const parsed = schoolContactSchema.safeParse(await readMessage(request));
    if (!parsed.success || parsed.data.website) throw new SchoolError(400, "Sprawdź dane w formularzu.");
    if (!schoolContactDeliveryEnabled()) throw new SchoolError(503, "Wysyłka jest chwilowo niedostępna. Napisz bezpośrednio na podany adres e-mail.");
    await verifyTurnstile(parsed.data.turnstileToken, ip, "school_contact");
    if (!await sendSchoolContact(parsed.data)) throw new SchoolError(503, "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na podany adres.");
    return NextResponse.json({ sent: true }, { headers: privateHeaders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof SchoolError ? error.message : "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na podany adres." }, { status: error instanceof SchoolError ? error.status : 503, headers: privateHeaders });
  }
}
