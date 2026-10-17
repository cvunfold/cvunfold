"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SchoolHeader } from "./school-header";

export function SchoolAccess({ confirm = false, serviceMessage }: { confirm?: boolean; serviceMessage?: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(serviceMessage || "");
  const [failed, setFailed] = useState(Boolean(serviceMessage));
  const [busy, setBusy] = useState(false);
  const confirmationRead = useRef(false);
  useEffect(() => {
    if (!confirm || confirmationRead.current) return;
    // Read once per mount; keep the code in the URL until explicit confirmation
    // so a reload or development remount cannot lose an unused code.
    confirmationRead.current = true;
    const params = new URLSearchParams(window.location.search);
    setCode(params.get("code") || "");
    if (!params.get("code")) {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const errorCode = params.get("error_code") || fragment.get("error_code");
      setMessage(errorCode === "otp_expired"
        ? "Link wygasł lub został już użyty. Poproś o nowy link do logowania."
        : "Link jest nieprawidłowy. Poproś o nowy link do logowania.");
      setFailed(true);
      window.history.replaceState(null, "", "/dla-szkol/potwierdz");
    }
  }, [confirm]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch("/api/schools/auth", { method: confirm ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(confirm ? { code } : { email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się zalogować.");
      if (confirm) {
        window.history.replaceState(null, "", "/dla-szkol/potwierdz");
        window.location.replace("/dla-szkol/panel");
      }
      else setMessage(data.message);
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Spróbuj ponownie później."); }
    finally { setBusy(false); }
  }
  return <div className="school-shell school-access-page">
    <SchoolHeader panelActive/>
    <main className="school-access-layout">
      <aside className="school-access-intro"><span className="school-eyebrow">Dla opiekunów szkół IT</span><h2>Cała grupa.<br/>Jasny plan poprawek.</h2><p>Zobacz, co warto dopracować w CV kursantów i przygotuj ich do kolejnego kroku.</p><ol><li><span>01</span><div><strong>Dodaj CV grupy</strong><p>Prześlij kilka dokumentów w jednej paczce.</p></div></li><li><span>02</span><div><strong>Zobacz wspólne trudności</strong><p>Przygotuj warsztat na podstawie dostępnych raportów.</p></div></li><li><span>03</span><div><strong>Przekaż indywidualny feedback</strong><p>Przejrzyj raport i przygotuj wiadomość dla kursanta.</p></div></li></ol><Link href="/dla-szkol/demo">Najpierw sprawdź demo <span aria-hidden="true">→</span></Link></aside>
      <section className="school-access"><span className="school-eyebrow">{confirm ? "Ostatni krok" : "Dostęp do panelu"}</span><h1>{confirm ? "Potwierdź logowanie" : "Panel Twojej szkoły"}</h1><p>{confirm ? "Kontynuuj, aby bezpiecznie otworzyć panel szkoły." : "Zaloguj się linkiem na e-mail, bez hasła. Użyj adresu, na który przyznano Ci dostęp do szkoły."}</p>
        <form onSubmit={submit}>{!confirm ? <label>Adres e-mail opiekuna<input type="email" autoComplete="email" required maxLength={254} placeholder="ty@twoja-szkola.pl" value={email} onChange={e => setEmail(e.target.value)} disabled={busy}/></label> : null}<button className="button" disabled={busy || (confirm && !code)}>{busy ? "Chwileczkę…" : confirm ? "Wejdź do panelu" : "Wyślij link do logowania"}</button></form>
        {message ? <p className={failed ? "school-access-message school-error" : "school-access-message"} role={failed ? "alert" : "status"}>{message}</p> : null}
        <p className="school-muted school-access-note">Dostęp mają wyłącznie zaproszeni opiekunowie. Link otwórz w tej samej przeglądarce, w której go zamówisz.</p>
        <div className="school-actions"><Link href="/dla-szkol/demo">Zobacz demo bez logowania →</Link>{confirm ? <Link href="/dla-szkol/panel">Poproś o nowy link</Link> : <Link href="/dla-szkol">Strona główna dla szkół</Link>}</div>
      </section>
    </main>
  </div>;
}
