"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { SCHOOL_CONTACT_EMAIL } from "@/lib/schools/offer";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { trackAnalyticsEvent } from "@/lib/analytics/client";

import { legalPath, type Locale } from "@/lib/i18n";

const copy = {
  "pl": {
    "name": "Imię i nazwisko",
    "email": "Służbowy e-mail",
    "school": "Szkoła lub bootcamp",
    "phone": "Numer telefonu (opcjonalnie)",
    "message": "Wiadomość (opcjonalnie)",
    "namePlaceholder": "Jan Kowalski",
    "emailPlaceholder": "jan@twojaszkola.pl",
    "schoolPlaceholder": "Nazwa szkoły lub bootcampu",
    "phonePlaceholder": "+48 123 456 789",
    "messagePlaceholder": "Napisz, jak pracujecie z CV kursantów i czego potrzebujecie.",
    "busy": "Wysyłamy wiadomość…",
    "submit": "Porozmawiajmy o współpracy",
    "sent": "Wiadomość została wysłana. Dziękuję, odezwę się na podany adres e-mail.",
    "draft": "Wiadomość jest przygotowana. Wyślij ją w swojej aplikacji pocztowej.",
    "open": "Otwórz wiadomość w poczcie",
    "note": "Formularz przygotuje wiadomość do wysłania w Twojej poczcie.",
    "privacy": "Dane wykorzystamy tylko do odpowiedzi na tę wiadomość.",
    "privacyLink": "Polityka prywatności",
    "error": "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz bezpośrednio na podany adres.",
    "retryError": "Nie udało się wysłać wiadomości. Spróbuj ponownie."
  },
  "en": {
    "name": "Full name",
    "email": "Work email",
    "school": "School or bootcamp",
    "phone": "Phone number (optional)",
    "message": "Message (optional)",
    "namePlaceholder": "Alex Smith",
    "emailPlaceholder": "alex@yourschool.com",
    "schoolPlaceholder": "School or bootcamp name",
    "phonePlaceholder": "+44 7700 900123",
    "messagePlaceholder": "Tell us how you work with your students’ CVs and what you need.",
    "busy": "Sending your message…",
    "submit": "Let’s talk about working together",
    "sent": "Your message has been sent. Thank you, I’ll reply to the email address you provided.",
    "draft": "Your message is ready. Send it using your email app.",
    "open": "Open message in your email app",
    "note": "This form prepares a message for you to send using your email app.",
    "privacy": "We’ll use your details only to reply to this message.",
    "privacyLink": "Privacy policy",
    "error": "We couldn’t send your message. Please try again or email us directly.",
    "retryError": "We couldn’t send your message. Please try again."
  }
} as const;

export function SchoolContactForm({ automaticDelivery = false, locale = "pl" }: { automaticDelivery?: boolean; locale?: Locale }) {
  const t = copy[locale];
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [challengeEpoch, setChallengeEpoch] = useState(0);
  const requestId = useRef<string | null>(null);
  const onToken = useCallback((value: string) => setToken(value), []);

  function changed() {
    setDraft(""); setSent(false); setError(""); requestId.current = null;
  }

  async function prepareMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const school = String(values.get("school") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const message = String(values.get("message") || "").trim();
    if (automaticDelivery) {
      setBusy(true); setSent(false); setError("");
      requestId.current ||= crypto.randomUUID();
      try {
        const response = await fetch("/api/schools/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, school, message, website: String(values.get("website") || ""), turnstileToken: token, requestId: requestId.current }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.sent !== true) throw new Error((locale === "pl" ? result.error : null) || t.error);
        trackAnalyticsEvent("school_contact_sent", { locale });
        setSent(true); form.reset(); requestId.current = null;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t.retryError);
      } finally { setBusy(false); setToken(""); setChallengeEpoch(value => value + 1); }
      return;
    }
    const body = `${t.name}: ${name}\n${t.email}: ${email}\n${locale === "pl" ? "Telefon" : "Phone"}: ${phone || (locale === "pl" ? "Nie podano" : "Not provided")}\n${t.school}: ${school}\n\n${message}`;
    setDraft(`mailto:${SCHOOL_CONTACT_EMAIL}?subject=${encodeURIComponent(`${locale === "pl" ? "CVUnfold dla szkół" : "CVUnfold for schools"}: ${school}`)}&body=${encodeURIComponent(body)}`);
  }

  return <form className="school-offer-form" onSubmit={prepareMessage} aria-busy={busy}>
    <div className="school-offer-fields">
      <label htmlFor="school-contact-name">{t.name}<input id="school-contact-name" name="name" autoComplete="name" required maxLength={120} placeholder={t.namePlaceholder} onChange={changed} disabled={busy}/></label>
      <label htmlFor="school-contact-email">{t.email}<input id="school-contact-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder={t.emailPlaceholder} onChange={changed} disabled={busy}/></label>
    </div>
    <label htmlFor="school-contact-school">{t.school}<input id="school-contact-school" name="school" autoComplete="organization" required maxLength={160} placeholder={t.schoolPlaceholder} onChange={changed} disabled={busy}/></label>
    <label htmlFor="school-contact-phone">{t.phone}<input id="school-contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder={t.phonePlaceholder} onChange={changed} disabled={busy}/></label>
    <label htmlFor="school-contact-message">{t.message}<textarea id="school-contact-message" name="message" maxLength={4000} rows={5} placeholder={t.messagePlaceholder} onChange={changed} disabled={busy}/></label>
    <div className="school-contact-trap" aria-hidden="true"><label htmlFor="school-contact-website">Website<input id="school-contact-website" name="website" tabIndex={-1} autoComplete="off" disabled={busy}/></label></div>
    {automaticDelivery ? <TurnstileWidget key={challengeEpoch} action="school_contact" siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} locale={locale} onToken={onToken}/> : null}
    <button className="button button-primary" type="submit" disabled={busy}>{busy ? t.busy : t.submit}<ArrowRight aria-hidden="true"/></button>
    {sent ? <p className="school-contact-success" role="status">{t.sent}</p> : null}
    {error ? <p className="school-error" role="alert">{error}</p> : null}
    {draft ? <div className="school-contact-draft" role="status"><p>{t.draft}</p><a href={draft} data-analytics-event="school_email_clicked" data-analytics-placement="email_draft"><Mail aria-hidden="true"/>{t.open}</a></div> : null}
    {!automaticDelivery ? <p className="school-contact-mail-note">{t.note}</p> : null}
    <div className="school-offer-privacy"><p>{t.privacy}</p><a href={legalPath(locale, "privacy")}>{t.privacyLink}</a></div>
  </form>;
}
