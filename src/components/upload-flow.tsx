"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    back: "Jak to działa", title: "Zobacz, na jaki poziom wygląda Twoje CV", intro: "Najpierw otrzymasz bezpłatny wynik wstępny z konkretnym dowodem. Pełny raport kupujesz dopiero, gdy diagnoza okaże się wartościowa.",
    drop: "Przeciągnij PDF lub DOCX", choose: "albo wybierz plik", change: "Wybierz inny plik", limit: "Maksymalnie 8 MB · tekstowy PDF lub DOCX",
    mobileDrop: "Wybierz CV z telefonu lub dostępnej chmury", mobileLimit: "PDF/DOCX · Dysk Google, iCloud lub Pliki · maks. 8 MB",
    aiDisclosure: "Analiza jest wspierana przez AI i wykonywana według określonych rubryk oraz zasad wiązania uwag z dowodami.",
    handoff: "Nie masz CV na telefonie? Udostępnij link na komputer", handoffShareTitle: "Dokończ analizę CV na komputerze",
    handoffShareText: "Otwórz ten bezpieczny link na komputerze. Wybierzesz tam plik CV ponownie.",
    handoffShared: "Link został udostępniony. Na komputerze wybierz plik CV ponownie.", handoffCopied: "Link skopiowany. Wyślij go na swój komputer i wybierz tam CV ponownie.",
    handoffFailed: "Nie udało się udostępnić linku. Spróbuj ponownie.", handoffOpened: "Bezpieczne ustawienia zostały przeniesione. Wybierz plik CV ponownie na tym urządzeniu.",
    invalidFile: "Wybierz plik PDF lub DOCX o rozmiarze do 8 MB.",
    scan: "Skanowany PDF lub zdjęcie CV może nie zostać odczytane.", language: "CV może być po polsku lub angielsku.",
    level: "Poziom", levels: [["auto", "Rozpoznaj automatycznie"], ["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"], ["lead", "Lead"]],
    offerToggle: "Dopasuj analizę do konkretnej oferty", offerLabel: "Treść ogłoszenia", optional: "opcjonalnie", offerPlaceholder: "Wklej treść ogłoszenia. Nie wpisuj danych kontaktowych.",
    consent: "Zlecam rozpoczęcie analizy od razu i akceptuję przetwarzanie CV zgodnie z polityką prywatności. Rozumiem, że plik źródłowy zostanie usunięty po analizie.",
    privacy: "Polityka prywatności", terms: "Regulamin", submit: "Analizuj CV", loading: "Analizujemy…", private: "Bez konta. CV nie trafia do pracodawców ani analytics.",
    plan: { full_review: "Pełny raport", job_match: "Raport + dopasowanie do oferty" }, free: "Wynik wstępny", freePrice: "Darmowe", full: "Pełny raport", oneTime: "płatność jednorazowa · bez subskrypcji",
    statusIdle: "Dowód przed opinią", statusIdleCopy: "Każda ważna uwaga wskazuje konkretny fragment dokumentu.", statusLoading: "Analizujemy Twoje CV", statusLoadingCopy: "Przechodzimy przez dokument krok po kroku.",
    evidenceTitle: "Raport nie zgaduje", evidenceCopy: "Jeśli informacji nie ma w CV, zobaczysz lukę lub pytanie — nie fałszywy fakt.",
    genericError: "Nie udało się rozpocząć analizy. Spróbuj ponownie.",
    stages: [["Czytam strukturę CV", "Tekst, sekcje i kolejność"], ["Rozpoznaję doświadczenie i projekty", "Bez wykonywania instrukcji z dokumentu"], ["Oceniam seniority i ownership", "Szukam dowodów, nie słów kluczowych"], ["Symuluję pierwsze 20 sekund", "Pierwsze wrażenie z samego dokumentu"], ["Buduję raport", "Waliduję dowody i bezpieczne sugestie"]],
  },
  en: {
    back: "How it works", title: "See what level your CV communicates", intro: "You first receive a free initial result with one concrete piece of evidence. You only buy the full report if the diagnosis proves useful.",
    drop: "Drop a PDF or DOCX", choose: "or choose a file", change: "Choose another file", limit: "Up to 8 MB · text-based PDF or DOCX",
    mobileDrop: "Choose a CV from your phone or available cloud storage", mobileLimit: "PDF/DOCX · Google Drive, iCloud or Files · max. 8 MB",
    aiDisclosure: "The review is supported by AI and follows defined role rubrics and rules that tie findings to evidence.",
    handoff: "Do not have your CV on your phone? Share a link to your computer", handoffShareTitle: "Finish your CV review on a computer",
    handoffShareText: "Open this safe link on your computer. You will select the CV file again there.",
    handoffShared: "Link shared. Select your CV again on the computer.", handoffCopied: "Link copied. Send it to your computer and select the CV there.",
    handoffFailed: "We could not share the link. Please try again.", handoffOpened: "Your safe settings were transferred. Select the CV file again on this device.",
    invalidFile: "Choose a PDF or DOCX file up to 8 MB.",
    scan: "A scanned PDF or image-based CV may not be readable.", language: "Your CV can be in English or Polish.",
    level: "Level", levels: [["auto", "Detect automatically"], ["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"], ["lead", "Lead"]],
    offerToggle: "Match the analysis to a specific job", offerLabel: "Job description", optional: "optional", offerPlaceholder: "Paste the job description. Do not include contact details.",
    consent: "I request that the analysis starts immediately and accept CV processing under the privacy policy. I understand that the source file is deleted after analysis.",
    privacy: "Privacy policy", terms: "Terms", submit: "Analyse my CV", loading: "Analysing…", private: "No account. Your CV is never sent to employers or analytics.",
    plan: { full_review: "Full report", job_match: "Report + job matching" }, free: "Initial result", freePrice: "Free", full: "Full report", oneTime: "one-time payment · no subscription",
    statusIdle: "Evidence before opinion", statusIdleCopy: "Every important finding points to a specific part of the document.", statusLoading: "Analysing your CV", statusLoadingCopy: "We move through the document step by step.",
    evidenceTitle: "The report does not guess", evidenceCopy: "If information is missing, you see a gap or a question — never an invented fact.",
    genericError: "We could not start the analysis. Please try again.",
    stages: [["Reading the CV structure", "Text, sections and order"], ["Identifying experience and projects", "Without following instructions in the document"], ["Assessing seniority and ownership", "Looking for evidence, not just keywords"], ["Simulating the first 20 seconds", "The impression created by the document alone"], ["Building the report", "Validating evidence and fact-safe suggestions"]],
  },
} as const;

type Props = {
  mockMode: boolean;
  initialJobMatch: boolean;
  initialRole: TargetRoleId;
  initialSeniority: Seniority;
  handoffFromMobile: boolean;
  initialHandoffOrigin?: HandoffOrigin;
  locale: Locale;
};

export function UploadFlow({ mockMode, initialJobMatch, initialRole, initialSeniority, handoffFromMobile, initialHandoffOrigin, locale }: Props) {
  const t = copy[locale];
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(() => mockMode && typeof File !== "undefined" ? new File([fixtureBytes], "synthetic-cv.pdf", { type: "application/pdf" }) : null);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [role, setRole] = useState<TargetRoleId>(initialRole);
  const [seniority, setSeniority] = useState<Seniority>(initialSeniority);
  const [showJob, setShowJob] = useState(initialJobMatch);
  const [job, setJob] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileEpoch, setTurnstileEpoch] = useState(0);
  const [handoffStatus, setHandoffStatus] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const plan: Plan = showJob && job.trim() ? "job_match" : "full_review";
  const effectiveHandoffOrigin = handoffFromMobile ? initialHandoffOrigin || "other" : initialHandoffOrigin;
  const handleTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);
  const handoffOpenTracked = useRef(false);

  useEffect(() => {
    if (!loading) { setActiveStage(0); return; }
    const timer = window.setInterval(() => setActiveStage((value) => Math.min(value + 1, t.stages.length - 1)), 3200);
    return () => window.clearInterval(timer);
  }, [loading, t.stages.length]);

  useEffect(() => {
    if (!handoffFromMobile || handoffOpenTracked.current) return;
    handoffOpenTracked.current = true;
    trackAnalyticsEvent("handoff_link_opened", {
      locale,
      market: locale,
      plan: initialJobMatch ? "job_match" : "full_review",
      landing_variant: DEFAULT_LANDING_VARIANT,
      broad_role_enum: initialRole,
      selected_seniority_enum: initialSeniority,
      handoff_origin: effectiveHandoffOrigin || "other",
    });
  }, [effectiveHandoffOrigin, handoffFromMobile, initialJobMatch, initialRole, initialSeniority, locale]);

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
      plan: showJob ? "job_match" : "full_review",
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
    const context = { ...analyticsBase(showJob ? "job_match" : "full_review"), handoff_origin: effectiveHandoffOrigin || handoffOriginFromAttribution(readSafeAttribution()) };
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
    setLoading(true);
    setError("");
    const selectedPlan: Plan = showJob && job.trim() ? "job_match" : "full_review";
    trackAnalyticsEvent("analysis_started", analyticsBase(selectedPlan));
    const form = new FormData();
    form.set("file", file);
    form.set("role", role);
    form.set("seniority", seniority);
    form.set("jobDescription", showJob ? job : "");
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
      trackAnalyticsEvent("upload_completed", analyticsBase(selectedPlan));
      trackAnalyticsEvent("analysis_succeeded", { ...analyticsBase(selectedPlan), analysis_success: true });
      router.push(`${data.reportPath}#${encodeURIComponent(data.accessToken)}`);
    } catch (caught) {
      const category = typeof caught === "object" && caught && "category" in caught ? String(caught.category) : "unknown";
      trackAnalyticsEvent("analysis_failed", { ...analyticsBase(selectedPlan), analysis_success: false, error_category: category });
      if (category === "configuration") {
        trackAnalyticsEvent("analysis_configuration_failed", { ...analyticsBase(selectedPlan), analysis_success: false });
      }
      setError(caught instanceof Error ? caught.message : t.genericError);
      setTurnstileToken("");
      setTurnstileEpoch((value) => value + 1);
      setLoading(false);
    }
  }

  return <main className="analysis-page">
    <header className="site-header container"><Logo locale={locale}/><a href={`${homePath(locale)}#jak`}>{t.back}</a></header>
    <div className="analysis-shell container">
      <form onSubmit={submit} aria-busy={loading}>
        <h1>{t.title}</h1>
        <p className="analysis-intro">{t.intro}</p>
        <div className="analysis-plan-summary" aria-label={t.full}>
          <div><span>{t.free}</span><strong>{t.freePrice}</strong></div>
          <div><span>{t.plan[plan]}</span><strong>{formatPlanPrice(plan, locale)}</strong><small>{t.oneTime}</small></div>
        </div>
        <p className="ai-upload-disclosure">{t.aiDisclosure}</p>
        {handoffFromMobile ? <p className="handoff-arrival" role="status">{t.handoffOpened}</p> : null}
        <button type="button" className={`dropzone ${file ? "has-file" : ""}`} disabled={loading}
          onClick={() => { trackAnalyticsEvent("file_picker_opened", analyticsBase()); input.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0] ?? null, "drop"); }}>
          <span className="upload-icon" aria-hidden="true">↑</span>
          <b>{file ? file.name : <><span className="desktop-upload-copy">{t.drop}</span><span className="mobile-upload-copy">{t.mobileDrop}</span></>}</b>
          <u>{file ? t.change : t.choose}</u>
          <small><span className="desktop-upload-copy">{t.limit}</span><span className="mobile-upload-copy">{t.mobileLimit}</span></small>
        </button>
        <input ref={input} hidden type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={loading}
          onChange={(event) => chooseFile(event.target.files?.[0] ?? null, "picker")} />
        <ul className="upload-notes"><li>{t.language}</li><li>{t.scan}</li></ul>
        <div className="desktop-handoff">
          <button type="button" onClick={() => void shareToDesktop()} disabled={loading}>{t.handoff}</button>
          <p role="status" aria-live="polite">{handoffStatus}</p>
        </div>

        <RoleSelect value={role} onChange={setRole} disabled={loading} locale={locale}/>
        <fieldset disabled={loading}><legend>{t.level}</legend><div className="segmented">
          {t.levels.map(([value, label]) => <label key={value}><input type="radio" name="seniority" value={value} checked={seniority === value} onChange={() => setSeniority(value)} /><span>{label}</span></label>)}
        </div></fieldset>
        <label className="job-toggle"><input type="checkbox" checked={showJob} disabled={loading} onChange={(event) => setShowJob(event.target.checked)}/><span>{t.offerToggle}</span></label>
        {showJob ? <label>{t.offerLabel} <small>({t.optional})</small><textarea value={job} disabled={loading} onChange={(event) => setJob(event.target.value)} maxLength={20000} placeholder={t.offerPlaceholder}/></label> : null}
        <label className="consent"><input type="checkbox" checked={consent} disabled={loading} onChange={(event) => setConsent(event.target.checked)}/><span>{t.consent} <a href={legalPath(locale, "privacy")}>{t.privacy}</a> · <a href={legalPath(locale, "terms")}>{t.terms}</a></span></label>
        <TurnstileWidget key={turnstileEpoch} siteKey={turnstileSiteKey} locale={locale} onToken={handleTurnstileToken}/>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button submit" disabled={!file || !consent || loading || Boolean(turnstileSiteKey && !turnstileToken)}>{loading ? t.loading : t.submit}<ArrowIcon/></button>
        <p className="form-trust"><LockIcon/>{t.private}</p>
      </form>

      <aside className="analysis-aside" aria-live="polite">
        <div className="analysis-status"><span className={loading ? "status-orbit active" : "status-orbit"} aria-hidden="true"/><div><h2>{loading ? t.statusLoading : t.statusIdle}</h2><p>{loading ? t.statusLoadingCopy : t.statusIdleCopy}</p></div></div>
        <ol>{t.stages.map(([step, detail], index) => <li className={loading && index <= activeStage ? "active" : ""} key={step}>{loading && index < activeStage ? <CheckIcon/> : <span>{index + 1}</span>}<div><b>{step}</b><small>{detail}</small></div></li>)}</ol>
        <div className="evidence-preview"><span className="evidence-mark" aria-hidden="true">“</span><div><b>{t.evidenceTitle}</b><p>{t.evidenceCopy}</p></div></div>
      </aside>
    </div>
    {mockMode ? <div className="dev-badge">DEV · MOCK MODE</div> : null}
  </main>;
}
