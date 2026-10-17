import { cookies, headers } from "next/headers";
import { SchoolPanel } from "@/components/schools/school-panel";
import { SchoolAccess } from "@/components/schools/school-access";
import { readSchoolData } from "@/lib/schools/data";
import { SchoolError, SCHOOL_COOKIE } from "@/lib/schools/server";

export const dynamic = "force-dynamic";
export default async function SchoolPanelPage() {
  const jar = await cookies();
  if (!jar.has(SCHOOL_COOKIE)) return <SchoolAccess/>;
  try {
    const incoming = await headers();
    const host = incoming.get("host") || "localhost";
    const request = new Request("http://localhost/dla-szkol/panel", { headers: { cookie: jar.toString(), host } });
    return <SchoolPanel initialData={await readSchoolData(request)} analysisEnabled={process.env.MOCK_MODE !== "true" && Boolean(process.env.OPENAI_API_KEY)}/>;
  } catch (error) {
    if (error instanceof SchoolError && error.status === 401) return <SchoolAccess serviceMessage={error.message}/>;
    // A data/configuration failure does not invalidate an authenticated session.
    return <main className="school-shell school-access-page"><section className="school-access">
      <h1>Panel jest chwilowo niedostępny</h1>
      <p role="alert">{error instanceof SchoolError ? error.message : "Nie udało się wczytać panelu. Spróbuj ponownie później."}</p>
      <p>Ten błąd nie oznacza wylogowania. Ponowne logowanie nie jest potrzebne do jego rozwiązania.</p>
      <a className="button" href="/dla-szkol/panel">Spróbuj ponownie</a>
    </section></main>;
  }
}
