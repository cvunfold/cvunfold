"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, CheckIcon, LockIcon } from "./icons";
import { Logo } from "./logo";
import { RoleSelect } from "./role-select";
import { readSafeAttribution, trackAnalyticsEvent } from "@/lib/analytics/client";
import { DEFAULT_LANDING_VARIANT, handoffOriginFromAttribution, type HandoffOrigin } from "@/lib/audience";
import type { TargetRoleId } from "@/lib/roles";
import type { Seniority } from "@/lib/rubrics/technical-v1";
import { formatPlanPrice, type Plan } from "@/lib/plans";
import { analysisPath, homePath, legalPath, type Locale } from "@/lib/i18n";
import { TurnstileWidget } from "@/components/turnstile-widget";

const fixtureBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const SUPPORTED_EXTENSION = /\.(pdf|docx)$/i;

const copy = {
  pl: {
    back: "Jak to działa", title: "Zobacz, co naprawdę komunikuje Twoje CV", intro: "Najpierw otrzymasz bezpłatny wynik wstępny z konkretnym dowodem. Pełny raport kupujesz dopiero, gdy diagnoza okaże się wartościowa.",
    drop: "Przeciągnij PDF lub DOCX", choose: "albo wybierz plik", change: "Wybierz inny plik", limit: "Maksymalnie 8 MB · tekstowy PDF lub DOCX",
    mobileDrop: "Wybierz CV z telefonu lub dostępnej chmury", mobileLimit: "PDF/DOCX · Dysk Google, iCloud lub Pliki · maks. 8 MB",
    aiDisclosure: "Analiza jest wspierana przez AI i wykonywana według określonych rubryk oraz zasad wiązania uwag z dowodami.",
    handoff: "Nie masz CV na telefonie? Udostępnij link na komputer", handoffShareTitle: "Dokończ analizę CV na komputerze",
    handoffShareText: "Otwórz ten bezpieczny link na komputerze. Wybierzesz tam plik CV ponownie.",
    handoffShared: "Link został udostępniony. Na komputerze wybierz plik CV ponownie.", handoffCopied: "Link skopiowany. Wyślij go na swój komputer i wybierz tam CV ponownie.",
    handoffFailed: "Nie udało się udostępnić linku. Spróbuj ponownie.", handoffOpened: "Bezpieczne ustawienia zostały przeniesione. Wybierz plik CV ponownie na tym urządzeniu.",
    invalidFile: "Wybierz plik PDF lub DOCX o rozmiarze do 8 MB.",
    scan: "Skanowany PDF lub zdjęcie CV może nie zostać odczytane.", language: "CV może być po polsku lub angielsku.",
    advancedToggle: "Poziom stanowiska", advancedHint: "opcjonalne",
    level: "Na jaki poziom aplikujesz?", levelHelper: "To tylko punkt odniesienia. Raport porówna wybrany poziom z tym, co komunikuje Twoje CV.", levels: [["auto", "Nie wiem — oceń na podstawie CV"], ["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"], ["lead", "Lead"]],
    consent: "Zlecam rozpoczęcie analizy od razu i akceptuję przetwarzanie CV zgodnie z polityką prywatności. Rozumiem, że plik źródłowy zostanie usunięty po analizie.",
    privacy: "Polityka prywatności", terms: "Regulamin", submit: "Analizuj CV", loading: "Analizujemy…", private: "Bez konta. CV nie trafia do pracodawców ani analytics.",
    planLabel: "Pełny raport", free: "Wynik wstępny", freePrice: "Darmowe", full: "Pełny raport", oneTime: "płatność jednorazowa · bez subskrypcji",
    statusIdle: "Dowód przed opinią", statusIdleCopy: "Każda ważna uwaga wskazuje konkretny fragment dokumentu.", statusLoading: "Analizujemy Twoje CV", statusLoadingCopy: "Przechodzimy przez dokument krok po kroku.",
    statusRedirecting: "Już za chwilę zostaniesz przekierowany do raportu", statusRedirectingCopy: "Analiza jest gotowa. Bezpiecznie otwieramy Twój wynik.",
    longWait: "To może chwilę potrwać — sprawdzamy każdy dowód, zanim coś napiszemy.",
    evidenceTitle: "Raport nie zgaduje", evidenceCopy: "Jeśli informacji nie ma w CV, zobaczysz lukę lub pytanie — nie fałszywy fakt.",
    genericError: "Nie udało się rozpocząć analizy. Spróbuj ponownie.",
    stages: [["Czytam strukturę CV", "Tekst, sekcje i kolejność"], ["Rozpoznaję doświadczenie i projekty", "Bez wykonywania instrukcji z dokumentu"], ["Oceniam odpowiedzialność i wpływ", "Szukam dowodów, nie słów kluczowych"], ["Symuluję pierwsze 20 sekund", "Pierwsze wrażenie z samego dokumentu"], ["Buduję raport", "Waliduję dowody i bezpieczne sugestie"]],
  },
  en: {
    back: "How it works", title: "See what your CV really communicates", intro: "You first receive a free initial result with one concrete piece of evidence. You only buy the full report if the diagnosis proves useful.",
    drop: "Drop a PDF or DOCX", choose: "or choose a file", change: "Choose another file", limit: "Up to 8 MB · text-based PDF or DOCX",
    mobileDrop: "Choose a CV from your phone or available cloud storage", mobileLimit: "PDF/DOCX · Google Drive, iCloud or Files · max. 8 MB",
    aiDisclosure: "The review is supported by AI and follows defined role rubrics and rules that tie findings to evidence.",
    handoff: "Do not have your CV on your phone? Share a link to your computer", handoffShareTitle: "Finish your CV review on a computer",
    handoffShareText: "Open this safe link on your computer. You will select the CV file again there.",
    handoffShared: "Link shared. Select your CV again on the computer.", handoffCopied: "Link copied. Send it to your computer and select the CV there.",
    handoffFailed: "We could not share the link. Please try again.", handoffOpened: "Your safe settings were transferred. Select the CV file again on this device.",
    invalidFile: "Choose a PDF or DOCX file up to 8 MB.",
    scan: "A scanned PDF or image-based CV may not be readable.", language: "Your CV can be in English or Polish.",
    advancedToggle: "Seniority level", advancedHint: "optional",
    level: "What level are you applying for?", levelHelper: "This is only a reference point. The report will compare your chosen level with what your CV communicates.", levels: [["auto", "Not sure — assess from my CV"], ["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"], ["lead", "Lead"]],
    consent: "I request that the analysis starts immediately and accept CV processing under the privacy policy. I understand that the source file is deleted after analysis.",
    privacy: "Privacy policy", terms: "Terms", submit: "Analyse my CV", loading: "Analysing…", private: "No account. Your CV is never sent to employers or analytics.",
    planLabel: "Full report", free: "Initial result", freePrice: "Free", full: "Full report", oneTime: "one-time payment · no subscription",
    statusIdle: "Evidence before opinion", statusIdleCopy: "Every important finding points to a specific part of the document.", statusLoading: "Analysing your CV", statusLoadingCopy: "We move through the document step by step.",
    statusRedirecting: "You’ll be redirected to your report in just a moment", statusRedirectingCopy: "Your analysis is ready. We are securely opening your result.",
    longWait: "This can take a little longer — we check every piece of evidence before writing anything.",
    evidenceTitle: "The report does not guess", evidenceCopy: "If information is missing, you see a gap or a question — never an invented fact.",
    genericError: "We could not start the analysis. Please try again.",
    stages: [["Reading the CV structure", "Text, sections and order"], ["Identifying experience and projects", "Without following instructions in the document"], ["Assessing responsibility and impact", "Looking for evidence, not just keywords"], ["Simulating the first 20 seconds", "The impression created by the document alone"], ["Building the report", "Validating evidence and fact-safe suggestions"]],
  },
} as const;

type AnalysisPhase = "idle" | "analyzing" | "redirecting";

type Props = {
  mockMode: boolean;
  initialRole: TargetRoleId;
  initialSeniority: Seniority;
  handoffFromMobile: boolean;
  initialHandoffOrigin?: HandoffOrigin;
  locale: Locale;
};

export function UploadFlow({ mockMode, initialRole, initialSeniority, handoffFromMobile, initialHandoffOrigin, locale }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const navigationFrame = useRef<number | null>(null);
  const [file, setFile] = useState<File | null>(() => mockMode && typeof File !== "undefined" ? new File([fixtureBytes], "synthetic-cv.pdf", { type: "application/pdf" }) : null);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [activeStage, setActiveStage] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [role, setRole] = useState<TargetRoleId>(initialRole);
  const [seniority, setSeniority] = useState<Seniority>(initialSeniority);
  // Seniority has a genuinely good default ("auto" lets the model infer it from
  // the CV), so it starts collapsed to keep the required path to the free result
  // at file + consent. A handoff link carrying an explicit level opens it, so the
  // choice made on the other device stays visible rather than silently applied.
  const [showAdvanced, setShowAdvanced] = useState(initialSeniority !== "auto");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileEpoch, setTurnstileEpoch] = useState(0);
  const [handoffStatus, setHandoffStatus] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const plan: Plan = "full_review";
  const advancedId = useId();
  const selectedLevel = t.levels.find(([value]) => value === seniority)?.[1] || seniority;
  const effectiveHandoffOrigin = handoffFromMobile ? initialHandoffOrigin || "other" : initialHandoffOrigin;
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handoffOpenTracked = useRef(false);
  const busy = phase !== "idle";

  useEffect(() => {
    if (phase === "idle") { setActiveStage(0); return; }
    if (phase === "redirecting") { setActiveStage(t.stages.length - 1); return; }
    const timer = window.setInterval(() => setActiveStage((value) => Math.min(value + 1, t.stages.length - 1)), 3200);
    return () => window.clearInterval(timer);
  }, [phase, t.stages.length]);

  useEffect(() => {
    if (phase !== "analyzing") { setLongWait(false); return; }
    // A slower model can genuinely still be working well past this; the
    // reassurance is timed off the wall clock, not off the fixed-interval
    // stepper above, which stalls on the last step long before this fires.
    const timer = window.setTimeout(() => setLongWait(true), 25_000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!busy) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    overlay.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [busy]);

  useEffect(() => () => {
    if (navigationFrame.current !== null) window.cancelAnimationFrame(navigationFrame.current);
  }, []);

  useEffect(() => {
    if (phase === "idle" && error) errorMessage.current?.focus();
  }, [error, phase]);

  useEffect(() => {
    if (!handoffFromMobile || handoffOpenTracked.current) return;
    handoffOpenTracked.current = true;
    trackAnalyticsEvent("handoff_link_opened", {
      locale,
      market: locale,
      plan: "full_review",
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: initialRole,
      selected_seniority_enum: initialSeniority,
      handoff_origin: effectiveHandoffOrigin || "other",
    });
  }, [effectiveHandoffOrigin, handoffFromMobile, initialRole, initialSeniority, locale]);

  useEffect(() => {
    const picker = input.current;
    if (!picker) return;
    const onNativeCancel = () => trackAnalyticsEvent("file_picker_cancelled", {
      locale,
      market: locale,
      plan,
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: role,
      selected_seniority_enum: seniority,
      ...(effectiveHandoffOrigin ? { handoff_origin: effectiveHandoffOrigin } : {}),
    });
    picker.addEventListener("cancel", onNativeCancel);
    return () => picker.removeEventListener("cancel", onNativeCancel);
  }, [effectiveHandoffOrigin, locale, plan, role, seniority]);

  function analyticsBase(selectedPlan: Plan = plan) {
    return {
      locale,
      market: locale,
      plan: selectedPlan,
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: role,
      selected_seniority_enum: seniority,
      ...(effectiveHandoffOrigin ? { handoff_origin: effectiveHandoffOrigin } : {}),
    };
  }

  function chooseFile(nextFile: File | null, uploadEntrypoint: "picker" | "drop") {
    setError("");
    if (!nextFile) { setFile(null); return; }
    if (!SUPPORTED_EXTENSION.test(nextFile.name) || nextFile.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setError(t.invalidFile);
      return;
    }
    setFile(nextFile);
    trackAnalyticsEvent("upload_started", { ...analyticsBase(), upload_entrypoint: uploadEntrypoint });
  }

  function handoffUrl(): string {
    return new URL(analysisPath(locale, {
      plan,
      role,
      seniority,
      handoff: "mobile",
    }), window.location.origin).toString();
  }

  async function copyHandoffLink(url: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("CLIPBOARD_UNAVAILABLE");
      }
      return true;
    } catch {
      return false;
    }
  }

  async function shareToDesktop() {
    const url = handoffUrl();
    const context = { ...analyticsBase(), handoff_origin: effectiveHandoffOrigin || handoffOriginFromAttribution(readSafeAttribution()) };
    if (typeof navigator.share === "function") {
      trackAnalyticsEvent("desktop_handoff_started", { ...context, handoff_method: "web_share" });
      try {
        await navigator.share({ title: t.handoffShareTitle, text: t.handoffShareText, url });
        trackAnalyticsEvent("desktop_handoff_completed", { ...context, handoff_method: "web_share" });
        setHandoffStatus(t.handoffShared);
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }
    trackAnalyticsEvent("desktop_handoff_started", { ...context, handoff_method: "clipboard" });
    if (await copyHandoffLink(url)) {
      trackAnalyticsEvent("desktop_handoff_completed", { ...context, handoff_method: "clipboard" });
      setHandoffStatus(t.handoffCopied);
    } else setHandoffStatus(t.handoffFailed);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !consent) return;
    setPhase("analyzing");
    setError("");
    trackAnalyticsEvent("analysis_started", analyticsBase());
    const form = new FormData();
    form.set("file", file);
    form.set("role", role);
    form.set("seniority", seniority);
    form.set("plan", plan);
    form.set("locale", locale);
    form.set("attribution", JSON.stringify({
      ...readSafeAttribution(),
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: role,
      selected_seniority_enum: seniority,
      ...(effectiveHandoffOrigin ? { handoff_origin: effectiveHandoffOrigin } : {}),
    }));
    form.set("turnstileToken", turnstileToken);
    try {
      const response = await fetch("/api/analyses", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(data.error || t.genericError), { category: data.errorCategory || "unknown" });
      trackAnalyticsEvent("upload_completed", analyticsBase());
      trackAnalyticsEvent("analysis_succeeded", { ...analyticsBase(), analysis_success: true });
      setActiveStage(t.stages.length - 1);
      setPhase("redirecting");
      navigationFrame.current = window.requestAnimationFrame(() => {
        router.push(`${data.reportPath}#${encodeURIComponent(data.accessToken)}`);
      });
    } catch (caught) {
      const category = typeof caught === "object" && caught && "category" in caught ? String(caught.category) : "unknown";
      trackAnalyticsEvent("analysis_failed", { ...analyticsBase(), analysis_success: false, error_category: category });
      if (category === "configuration") {
        trackAnalyticsEvent("analysis_configuration_failed", { ...analyticsBase(), analysis_success: false });
      }
      setError(caught instanceof Error ? caught.message : t.genericError);
      setTurnstileToken("");
      setTurnstileEpoch((value) => value + 1);
      setPhase("idle");
    }
  }

  return <main className="analysis-page">
    <header className="site-header container" inert={busy} aria-hidden={busy}><Logo locale={locale}/><a href={`${homePath(locale)}#jak`}>{t.back}</a></header>
    <div className="analysis-shell container" inert={busy} aria-hidden={busy}>
      <form onSubmit={submit} aria-busy={busy}>
        <h1>{t.title}</h1>
        <p className="analysis-intro">{t.intro}</p>
        <div className="analysis-plan-summary" aria-label={t.full}>
          <div><span>{t.free}</span><strong>{t.freePrice}</strong></div>
          <div><span>{t.planLabel}</span><strong>{formatPlanPrice(plan, locale)}</strong><small>{t.oneTime}</small></div>
        </div>
        <p className="ai-upload-disclosure">{t.aiDisclosure}</p>
        {handoffFromMobile ? <p className="handoff-arrival" role="status">{t.handoffOpened}</p> : null}
        <button type="button" className={`dropzone ${file ? "has-file" : ""}`} disabled={busy}
          onClick={() => { trackAnalyticsEvent("file_picker_opened", analyticsBase()); input.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0] ?? null, "drop"); }}>
          <span className="upload-icon" aria-hidden="true">↑</span>
          <b>{file ? file.name : <><span className="desktop-upload-copy">{t.drop}</span><span className="mobile-upload-copy">{t.mobileDrop}</span></>}</b>
          <u>{file ? t.change : t.choose}</u>
          <small><span className="desktop-upload-copy">{t.limit}</span><span className="mobile-upload-copy">{t.mobileLimit}</span></small>
        </button>
        <input ref={input} hidden type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={busy}
          onChange={(event) => chooseFile(event.target.files?.[0] ?? null, "picker")} />
        <ul className="upload-notes"><li>{t.language}</li><li>{t.scan}</li></ul>
        <div className="desktop-handoff">
          <button type="button" onClick={() => void shareToDesktop()} disabled={busy}>{t.handoff}</button>
          <p role="status" aria-live="polite">{handoffStatus}</p>
        </div>

        <RoleSelect value={role} onChange={setRole} disabled={busy} locale={locale}/>
        <div className="analysis-advanced">
          <button type="button" className="analysis-advanced-toggle" aria-expanded={showAdvanced} aria-controls={advancedId} disabled={busy} onClick={() => setShowAdvanced((value) => !value)}>
            <span><b>{t.advancedToggle}</b><small>{selectedLevel} · {t.advancedHint}</small></span>
            <i aria-hidden="true"/>
          </button>
          {showAdvanced ? <fieldset id={advancedId} disabled={busy}><legend>{t.level}</legend><div className="segmented">
            {t.levels.map(([value, label]) => <label key={value}><input type="radio" name="seniority" value={value} checked={seniority === value} onChange={() => setSeniority(value)} /><span>{label}</span></label>)}
          </div><small className="level-helper">{t.levelHelper}</small></fieldset> : null}
        </div>
        <label className="consent"><input type="checkbox" checked={consent} disabled={busy} onChange={(event) => setConsent(event.target.checked)}/><span>{t.consent} <a href={legalPath(locale, "privacy")}>{t.privacy}</a> · <a href={legalPath(locale, "terms")}>{t.terms}</a></span></label>
        <TurnstileWidget key={turnstileEpoch} siteKey={turnstileSiteKey} locale={locale} onToken={handleTurnstileToken}/>
        {error ? <p ref={errorMessage} className="form-error" role="alert" tabIndex={-1}>{error}</p> : null}
        <button className="button submit" disabled={!file || !consent || busy || Boolean(turnstileSiteKey && !turnstileToken)}>{busy ? t.loading : t.submit}<ArrowIcon/></button>
        <p className="form-trust"><LockIcon/>{t.private}</p>
      </form>

      <aside className="analysis-aside">
        <div className="analysis-status"><span className="status-orbit" aria-hidden="true"/><div><h2>{t.statusIdle}</h2><p>{t.statusIdleCopy}</p></div></div>
        <ol>{t.stages.map(([step, detail], index) => <li key={step}><span>{index + 1}</span><div><b>{step}</b><small>{detail}</small></div></li>)}</ol>
        <div className="evidence-preview"><span className="evidence-mark" aria-hidden="true">“</span><div><b>{t.evidenceTitle}</b><p>{t.evidenceCopy}</p></div></div>
      </aside>
    </div>
    {busy ? <div ref={overlay} className="analysis-progress-overlay" role="dialog" aria-modal="true" aria-labelledby="analysis-progress-title" tabIndex={-1}>
      <div className="analysis-progress-card">
        <div className="analysis-status" role="status" aria-live="polite" aria-atomic="true">
          {phase === "redirecting" ? <span className="status-complete" aria-hidden="true"><CheckIcon/></span> : <span className="status-orbit active" aria-hidden="true"/>}
          <div><h2 id="analysis-progress-title" className={phase === "redirecting" ? "redirecting-message" : undefined}>{phase === "redirecting" ? t.statusRedirecting : t.statusLoading}</h2><p>{phase === "redirecting" ? t.statusRedirectingCopy : t.statusLoadingCopy}</p></div>
          {longWait && phase === "analyzing" ? <p className="analysis-long-wait" role="status">{t.longWait}</p> : null}
        </div>
        <ol>{t.stages.map(([step, detail], index) => {
          const complete = phase === "redirecting" || index < activeStage;
          const active = phase === "analyzing" && index === activeStage;
          return <li className={`${complete ? "complete" : ""}${active ? " active" : ""}`} aria-current={active ? "step" : undefined} key={step}>{complete ? <CheckIcon/> : <span>{index + 1}</span>}<div><b>{step}</b><small>{detail}</small></div></li>;
        })}</ol>
        <div className="evidence-preview"><span className="evidence-mark" aria-hidden="true">“</span><div><b>{t.evidenceTitle}</b><p>{t.evidenceCopy}</p></div></div>
      </div>
    </div> : null}
    {mockMode ? <div className="dev-badge">DEV · MOCK MODE</div> : null}
  </main>;
}
