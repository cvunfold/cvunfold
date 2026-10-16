"use client";
import { schoolDate, schoolDateTime } from "@/lib/schools/date-format";
import { AnimatedDetails } from "@/components/animated-details";

import { SchoolBatchUpload } from "./batch-upload";
import { SchoolBatchProgress } from "./batch-progress";
import { SchoolGroupMetrics } from "./group-metrics";
import { SchoolQuote } from "./school-quote";
import { SchoolReportNavigation } from "./report-navigation";
import { SchoolRevisionComparison } from "./revision-comparison";
import { FilePicker } from "@/components/file-picker";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { AtsPanel } from "@/components/ats-panel";
import { RevisionGuidance } from "@/components/revision-brief";
import { SchoolReportRating } from "./report-rating";
import { SchoolRevisionQuestions } from "./revision-questions";
import { SchoolRevisionTools } from "./school-revision-tools";
import { SCHOOL_PILOT } from "@/lib/schools/pilot-plan";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import { ContactActions } from "./contact-actions";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FeedbackComposer } from "./feedback-composer";
import { SchoolSelect } from "./school-select";
import { DeleteGroupDialog } from "./delete-group-dialog";
import { CreateGroupDialog } from "./create-group-dialog";
import { SchoolPdfPreview } from "./pdf-preview";
import { SchoolHeader } from "./school-header";
import { summarizeSchool, sortSchoolStudents, type StudentSort, type SchoolData, type SchoolReport, type SchoolStudent } from "@/lib/schools/model";
import type { CVReport, TeaserReport } from "@/lib/ai/schemas/report";
import { getTargetRoleOptions } from "@/lib/roles";
import { validateUpload } from "@/lib/security/upload";
import { applySchoolAnswerContext, schoolAnswerMethod, type SavedSchoolAnswer } from "@/lib/schools/revision-context";
import { readSchoolAnswerHistory, writeSchoolAnswerHistory, clearSchoolAnswerHistory } from "@/lib/client/school-revision-answers";

type UploadItem = { file: File; name: string; status: "waiting" | "analysing" | "complete" | "failed"; error?: string };
const severityLabels = { critical: "Krytyczny", important: "Ważny", minor: "Drobny" };

function Meter({ label, value, suffix = " / 100" }: { label: string; value: number; suffix?: string }) {
  return <div className="school-meter"><div><span>{label}</span><strong>{value}{suffix}</strong></div><div className="school-track"><div style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div></div>;
}

export function SchoolPanel({ initialData, demo = false, demoMore = [], demoGroups = [], analysisEnabled = true }: { initialData: SchoolData; demo?: boolean; demoMore?: SchoolStudent[]; demoGroups?: SchoolData[]; analysisEnabled?: boolean }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<"group" | "report">("group");
  const [selected, setSelected] = useState<string | null>(null);
  const [report, setReport] = useState<SchoolReport | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<SavedSchoolAnswer[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<StudentSort | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [consent, setConsent] = useState(false);
  const [newGroup, setNewGroup] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteReportOpen, setDeleteReportOpen] = useState(false);
  const [demoAdded, setDemoAdded] = useState(false);
  const reportRequest = useRef(0);
  const selectedReport = useRef<string | null>(null);
  const feedbackRequest = useRef(0);
  const [feedbackTarget, setFeedbackTarget] = useState<{ id: string; request: number; email: string } | null>(null);
  const summary = summarizeSchool(data.students);
  const student = data.students.find(p => p.id === selected);
  const revisedSource = report?.version === 1 ? student?.sample?.revision : undefined;
  const sampleSourceUrl = revisedSource?.sourceUrl || student?.sample?.sourceUrl;
  const samplePreviewUrl = revisedSource?.sourceUrl || student?.sample?.displayUrl || student?.sample?.sourceUrl;
  const sampleDocumentLabel = student?.sample?.revision
    ? revisedSource ? "CV po poprawkach" : "CV przed poprawkami"
    : "Źródłowe CV";
  const visible = sortSchoolStudents(data.students.filter(p => !filter || ((p.paid || p.testAccess) && p.report?.issues.some(i => i.category === filter && i.severity !== "minor"))), sort);
  const group = data.groups.find(g => g.id === data.groupId);
  const answerScope = report?.answerScope || (demo && student ? `demo:${data.groupId}:${student.id}` : undefined);
  const answerReport = report && !report.demoRevisionPreview && (report.fullAccess ?? report.paid) ? report.report as CVReport : null;
  const answerMethod = answerReport ? schoolAnswerMethod(answerReport, student?.comparisonKey) : "";
  const currentAnswers = savedAnswers.filter(item => item.method === answerMethod);
  const displayReport = report && answerReport ? { ...report, report: applySchoolAnswerContext(answerReport, report.version || 0, answerMethod, savedAnswers) } : report;
  function restoreAnswers(payload: SchoolReport, id: string) {
    const scope = payload.answerScope || (demo ? `demo:${data.groupId}:${id}` : undefined);
    setSavedAnswers(scope && (payload.fullAccess ?? payload.paid) ? readSchoolAnswerHistory(scope, id) : []);
  }
  function rememberAnswers(records: SavedSchoolAnswer[]) {
    if (!answerScope || !student || !report) throw new Error("Brak sesji odpowiedzi.");
    writeSchoolAnswerHistory(answerScope, student.id, report.expiresAt, records);
    setSavedAnswers(records);
  }

  function changeSort(key: StudentSort["key"]) {
    setSort(current => ({ key, direction: current?.key === key ? current.direction === "asc" ? "desc" : "asc" : key === "name" ? "asc" : "desc" }));
  }
  function sortArrow(key: StudentSort["key"]) { return sort?.key === key ? sort.direction === "asc" ? "↑" : "↓" : "↕"; }
  function sortState(key: StudentSort["key"]): "ascending" | "descending" | "none" { return sort?.key === key ? sort.direction === "asc" ? "ascending" : "descending" : "none"; }

  async function jsonRequest(url: string, init?: RequestInit) {
    const response = await fetch(url, { ...init, cache: "no-store" });
    const payload = await response.json();
    if (response.status === 401) { window.location.replace("/dla-szkol/panel"); throw new Error("Sesja wygasła. Zaloguj się ponownie."); }
    if (!response.ok) throw new Error(payload.error || "Spróbuj ponownie później.");
    return payload;
  }
  async function refresh(groupId?: string) {
    const payload = await jsonRequest(`/api/schools${groupId ? `?group=${encodeURIComponent(groupId)}` : ""}`);
    setData(payload); return payload as SchoolData;
  }

  function selectDemoGroup(groupId: string) {
    const next = demoGroups.find(item => item.groupId === groupId);
    if (!next) return;
    ++reportRequest.current; selectedReport.current = null;
    setData(next); setSelected(null); setReport(null); setSavedAnswers([]); setView("group");
    setFilter(null); setSort(null); setFeedbackTarget(null); setMessage(""); setError("");
  }

  async function openReport(id: string, sessionId?: string, feedbackEmail?: string, version?: number) {
    if (feedbackEmail && view === "report" && selected === id && report && (report.fullAccess ?? report.paid)) {
      setFeedbackTarget({ id, request: ++feedbackRequest.current, email: feedbackEmail });
      return;
    }
    const current = ++reportRequest.current;
    setFeedbackTarget(feedbackEmail ? { id, request: ++feedbackRequest.current, email: feedbackEmail } : null);
    selectedReport.current = id;
    setSelected(id); setReport(null); setSavedAnswers([]); setView("report"); setError("");
    if (!feedbackEmail && version === undefined && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
    if (demo) {
      const sample = data.students.find(p => p.id === id);
      if (sample?.report) {
        const pair = sample.sample?.revision?.analysis;
        const selectedVersion = version ?? (pair ? 1 : 0);
        const payload = { paid: true, report: pair ? selectedVersion === 1 ? pair.after : pair.before : sample.report, expiresAt: sample.expiresAt, version: selectedVersion, demoRevisionPreview: !pair && selectedVersion === 1 && !!sample.sample?.revision, iterationsAvailable: false, revisions: pair ? [{ version: 0, score: pair.before.summary.overallScore, createdAt: pair.beforeCreatedAt }, { version: 1, score: pair.after.summary.overallScore, createdAt: pair.afterCreatedAt }] : [{ version: 0, score: sample.report.summary.overallScore, createdAt: sample.createdAt }, ...(sample.sample?.revision ? [{ version: 1, score: sample.report.summary.overallScore, createdAt: sample.sample.revision.createdAt }] : [])] };
        restoreAnswers(payload, id); setReport(payload);
      }
      return;
    }
    try {
      const payload = await jsonRequest(`/api/schools/reports/${encodeURIComponent(id)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : version !== undefined ? `?version=${version}` : ""}`);
      if (current === reportRequest.current) {
        restoreAnswers(payload, id); setReport(payload);
        if (feedbackEmail && !(payload.fullAccess ?? payload.paid)) setMessage("Przygotowanie maila z poprawkami jest dostępne po odblokowaniu pełnego raportu.");
      }
      if (sessionId) {
        await refresh(data.groupId || undefined);
        if (!(payload.fullAccess ?? payload.paid)) setMessage("Płatność nie jest jeszcze potwierdzona. Odśwież raport za chwilę.");
      }
    } catch (caught) { if (current === reportRequest.current) setError(caught instanceof Error ? caught.message : "Nie udało się odczytać raportu."); }
  }
  useEffect(() => {
    if (demo) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("report");
    const groupId = params.get("group");
    if (groupId && !id) void refresh(groupId).catch(() => setError("Nie udało się odczytać grupy."));
    if (id) void openReport(id);
    if (id || params.has("checkout") || params.has("package_checkout")) window.history.replaceState(null, "", "/dla-szkol/panel");
    // Open the requested group/report once; payment flags grant no school access.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queueActive = data.batches?.some(batch => batch.status !== "complete") ?? false;
  useEffect(() => {
    if (demo || !queueActive || !data.groupId) return;
    let disposed = false, fetching = false;
    const controller = new AbortController();
    const groupId = data.groupId;
    const poll = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const response = await fetch(`/api/schools?group=${encodeURIComponent(groupId)}`, { cache: "no-store", signal: controller.signal });
        if (response.ok) { const payload = await response.json(); if (!disposed) setData(current => current.groupId === groupId ? payload : current); }
      } catch { /* A temporary network failure does not stop the server queue. */ }
      finally { fetching = false; }
    };
    const timer = window.setInterval(() => void poll(), 10_000);
    return () => { disposed = true; controller.abort(); window.clearInterval(timer); };
  }, [demo, queueActive, data.groupId]);

  async function changeVersion(version: number, expectedId: string) {
    if (selectedReport.current !== expectedId) return;
    const id = expectedId;
    if (demo) { await openReport(id, undefined, undefined, version); return; }
    const current = ++reportRequest.current;
    const payload = await jsonRequest(`/api/schools/reports/${encodeURIComponent(id)}?version=${version}`);
    if (current !== reportRequest.current) return;
    restoreAnswers(payload, id); setReport(payload);
    await refresh(data.groupId || undefined);
  }
  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await jsonRequest("/api/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), role: form.get("role"), seniority: form.get("seniority") }) });
      const updated = await refresh();
      if (updated.groups.length) await refresh(updated.groups[updated.groups.length - 1].id);
      setNewGroup(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się utworzyć grupy."); }
    finally { setBusy(false); }
  }

  async function runUploads(event: FormEvent) {
    event.preventDefault(); if (!data.groupId || !consent || busy) return;
    setBusy(true); setError("");
    const groupId = data.groupId;
    let completed = 0;
    for (let index = 0; index < uploads.length; index++) {
      const item = uploads[index]; if (item.status === "complete") continue;
      setUploads(rows => rows.map((row, i) => i === index ? { ...row, status: "analysing", error: undefined } : row));
      try {
        try { validateUpload(item.file); }
        catch (validation) {
          const code = validation instanceof Error ? validation.message : "";
          throw new Error(code === "FILE_TOO_LARGE" ? "Plik jest za duży. Maksymalny rozmiar to 8 MB." : code === "EMPTY_FILE" ? "Plik jest pusty." : "Wybierz poprawny plik PDF lub DOCX.");
        }
        const form = new FormData();
        form.set("file", item.file); form.set("schoolGroupId", groupId); form.set("schoolStudentName", item.name);
        form.set("schoolConsent", "true");
        await jsonRequest("/api/analyses", { method: "POST", body: form });
        completed++;
        setUploads(rows => rows.map((row, i) => i === index ? { ...row, status: "complete" } : row));
      } catch (caught) {
        const detail = caught instanceof Error ? caught.message : "Nie udało się przeanalizować CV.";
        setUploads(rows => rows.map((row, i) => i === index ? { ...row, status: "failed", error: detail } : row));
      }
    }
    try { await refresh(groupId); } catch { setError("Nie udało się odświeżyć grupy. Raporty zostały zapisane; odśwież stronę."); }
    setMessage(`Analiza paczki zakończona. Nowe raporty: ${completed}. Nieudane pliki możesz poprawić i ponowić.`); setBusy(false);
  }

  async function removeReport() {
    if (!selected || busy || !deleteReportOpen || demo) return;
    setBusy(true); setError("");
    try {
      await jsonRequest(`/api/schools/reports/${selected}`, { method: "DELETE" });
      clearSchoolAnswerHistory(selected);
      setDeleteReportOpen(false);
      await refresh(data.groupId || undefined); setSelected(null); setReport(null); setView("group"); setMessage("Raport został usunięty.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się usunąć raportu."); }
    finally { setBusy(false); }
  }

  async function removeGroup() {
    if (demo || busy || !group || !deleteGroupOpen) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await jsonRequest("/api/schools", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId: group.id, confirmed: true }) });
      data.students.forEach(item => clearSchoolAnswerHistory(item.id));
      setDeleteGroupOpen(false);
      ++reportRequest.current;
      const groups = data.groups.filter(item => item.id !== group.id);
      setData({ schoolName: data.schoolName, groups, groupId: groups[0]?.id || null, students: [] });
      setSelected(null); setReport(null); setFeedbackTarget(null); setView("group");
      setFilter(null); setSort(null); setUploads([]); setConsent(false); setUploadOpen(false); setNewGroup(false);
      setMessage("Grupa i powiązane dane kursantów zostały usunięte.");
      try { await refresh(); }
      catch { setError("Grupa została usunięta, ale nie udało się odświeżyć panelu. Odśwież stronę."); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się usunąć grupy."); }
    finally { setBusy(false); }
  }

  return <div className={`school-shell school-workspace school-workspace-${view}`}><SchoolHeader demo={demo} panelActive={!demo} busy={busy} onLogout={demo ? undefined : async () => { try { await jsonRequest("/api/schools/auth", { method: "DELETE" }); clearSchoolAnswerHistory(); window.location.replace("/dla-szkol/panel"); } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się wylogować."); } }}/>
    <div className="school-body">
    <main className="school-main"><div className="school-context"><span>{data.schoolName}</span></div>{data.testAccessExpiresAt ? <p role="status" className="school-badge">Lokalny dostęp testowy do pełnych raportów · bez płatności · do {schoolDateTime(data.testAccessExpiresAt)}</p> : null}{error && !deleteGroupOpen && !deleteReportOpen && !newGroup ? <p role="alert" className="school-error">{error}</p> : null}{message ? <p role="status">{message}</p> : null}
      {view === "group" ? <>
      <div className="school-heading"><div><span className="school-eyebrow">Twoja grupa</span><h1>Jak wyglądają CV kursantów?</h1>{data.groups.length ? <SchoolSelect className="school-group-label" label="Grupa" value={data.groupId || ""} disabled={busy || (demo && !demoGroups.length)} options={data.groups.map(g => ({ id: g.id, label: g.name, mark: getTargetRoleOptions("pl").find(role => role.id === g.target_role)?.shortLabel || "?" }))} onChange={async groupId => { if (demo) { selectDemoGroup(groupId); return; } setBusy(true); ++reportRequest.current; setError(""); setFilter(null); setUploads([]); setConsent(false); setSelected(null); setReport(null); try { await refresh(groupId); } catch (caught) { setError(caught instanceof Error ? caught.message : "Nie udało się odczytać grupy."); } finally { setBusy(false); } }}/> : <p>Utwórz pierwszą grupę, aby dodać CV kursantów.</p>}</div><div className="school-actions">{demo && demoGroups.length > 1 ? <button onClick={() => selectDemoGroup(data.groupId !== "demo-frontend-evidence" ? "demo-frontend-evidence" : "demo-anna-iteration")}>{data.groupId !== "demo-frontend-evidence" ? "Zobacz archiwalne CV" : "Zobacz iterację Anny"}</button> : null}{demo && data.groupId !== "demo-guided-iterations" && demoGroups.some(g => g.groupId === "demo-guided-iterations") ? <button type="button" onClick={() => selectDemoGroup("demo-guided-iterations")}>Zobacz poprawki grupy</button> : null}{!demo ? <button disabled={busy} aria-haspopup="dialog" onClick={() => { setError(""); setNewGroup(true); }}>Nowa grupa</button> : null}{!demo && group ? <button disabled={busy} onClick={() => { setError(""); setDeleteGroupOpen(true); }}>Usuń grupę</button> : null}<button className="button" disabled={busy || (!demo && (!data.groupId || !analysisEnabled)) || (demo && demoMore.length > 0 && demoAdded)} onClick={() => {
        if (demo && !demoMore.length) { void openReport(selected || data.students[0].id); }
        else if (demo) { setData(current => ({ ...current, students: [...current.students, ...demoMore] })); setDemoAdded(true); setMessage("Dodano 2 fikcyjne CV. Podsumowanie grupy zostało przeliczone."); }
        else setUploadOpen(!uploadOpen);
      }}>{demo ? !demoMore.length ? "Zobacz przykładowy raport" : demoAdded ? "Dodano paczkę demo" : "Dodaj przykładową paczkę CV" : "Dodaj CV kursantów"}</button></div></div>
      {!demo && group ? <section className="school-card school-package"><h2>Dostęp szkoły</h2><p>Rozliczamy współpracę ze szkołą na podstawie faktury. Warunki i dostęp do raportów ustalamy bezpośrednio.</p><p>Wykorzystane miejsca: {data.package?.used ?? data.students.length} z {SCHOOL_PILOT.seats}. Usunięcie raportu nie odnawia limitu.</p>{data.package?.paid ? <p>Dostęp {data.package.source === "invoice" ? "na podstawie faktury " : ""}aktywny do {schoolDate(data.package.expiresAt!)}.</p> : <Link href="/dla-szkol#kontakt">Ustal dostęp dla szkoły</Link>}</section> : null}
      {uploadOpen && !demo && data.backgroundUploadsEnabled && data.groupId ? <SchoolBatchUpload key={data.groupId} groupId={data.groupId} remainingSeats={Math.max(0, 30 - (data.package?.used || 0))} timing={data.analysisTiming} onBusy={setBusy} onClose={() => setUploadOpen(false)} onSubmitted={async () => { const updated = await refresh(data.groupId || undefined); setUploadOpen(false); setMessage(updated.batches?.some(batch => batch.status === "queued" || batch.status === "processing") ? "Paczka została zapisana. Analizy trwają na serwerze; możesz zamknąć stronę i wrócić później." : "Przesyłanie zakończone. Sprawdź status każdego pliku poniżej."); }}/> : null}
      {!demo && data.batches && data.analysisTiming ? <SchoolBatchProgress batches={data.batches} timing={data.analysisTiming} onResume={async batchId => { await jsonRequest("/api/schools/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "commit", batchId }) }); await refresh(data.groupId || undefined); }}/> : null}
      {uploadOpen && !demo && !data.backgroundUploadsEnabled ? <form onSubmit={runUploads} className="school-card school-form"><h2>Dodaj kilka CV</h2><p>PDF lub DOCX, do 8 MB na plik. Maksymalnie 30 plików w paczce. Analizujemy po kolei; błąd jednego CV nie blokuje pozostałych.</p><p>{data.testAccessExpiresAt ? "Pełne raporty są dostępne testowo w tej grupie." : "Dostęp do pełnych raportów ustalamy ze szkołą. Rozliczenie odbywa się na podstawie faktury."} Podsumowanie grupy obejmuje dostępne pełne raporty.</p><FilePicker label="Pliki CV" multiple files={uploads.map(item => item.file)} disabled={busy} onChange={e => {
        const files = Array.from(e.target.files || []); setError("");
        if (files.length > 30) { setUploads([]); setError("Wybierz maksymalnie 30 CV."); e.target.value = ""; return; }
        setUploads(files.map(file => ({ file, name: file.name.replace(/\.(pdf|docx)$/i, "").replace(/[_-]/g, " ").slice(0, 120), status: "waiting" })));
      }}/>
      {uploads.map((item, index) => <div className="school-upload-item" key={index}><label>Nazwa kursanta<input required maxLength={120} value={item.name} disabled={busy || item.status === "complete"} onChange={e => setUploads(rows => rows.map((row, i) => i === index ? { ...row, name: e.target.value } : row))}/></label><span role="status">{{ waiting: "Oczekuje", analysing: "Analizowanie…", complete: "Raport gotowy", failed: "Błąd" }[item.status]}</span>{item.error ? <p className="school-error">{item.error}</p> : null}</div>)}
      <label className="school-consent"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} required/>Mam prawo przekazać te CV do analizy i poinformowałem kursantów o przetwarzaniu raportów i danych kontaktowych odczytanych z CV. Rozumiem, że pliki źródłowe nie są przechowywane, a raporty i dane kontaktowe wygasają zgodnie z okresem widocznym przy raporcie.</label><Link href="/polityka-prywatnosci">Zasady prywatności</Link><button className="button" disabled={busy || !uploads.some(u => u.status !== "complete") || !consent}>{busy ? "Analizowanie paczki…" : "Analizuj / ponów nieudane CV"}</button><button type="button" disabled={busy} onClick={() => { setUploadOpen(false); setUploads([]); setConsent(false); }}>Zamknij upload</button></form> : null}
      {!demo && !analysisEnabled ? <p role="status" className="school-muted">Analizy prawdziwych CV są obecnie wyłączone w tym środowisku. Możesz przetestować logowanie, grupy i publiczne demo.</p> : null}

      <p className="school-muted">{demo ? "Osoby, doświadczenie, kontakty i projekty są fikcyjne. Raporty zostały wygenerowane przez AI na podstawie tych dokumentów. Demo nie przyjmuje prawdziwych plików." : `${data.students.length} aktywnych CV · ${summary.count} odblokowanych raportów. Wygasłe i usunięte raporty są pomijane.`}</p>
      {!summary.comparable ? <p role="status">Raporty używają różnych wersji kryteriów. Nie łączymy ich ocen w jedną średnią. Otwórz raporty indywidualne.</p> : null}
      {summary.progress ? <section className="school-card school-progress"><h2>Przed i po poprawkach</h2><p>Średnia dla tych samych {summary.progress.count} kursantów z ponowną analizą: {summary.progress.before}/100 → {summary.progress.after}/100.</p><p className="school-muted">Porównujemy pierwszą i najnowszą wersję przy tych samych kryteriach. Podsumowanie grupy poniżej uwzględnia najnowsze raporty.</p></section> : null}
      <SchoolGroupMetrics summary={summary}/>
      <section className="school-card school-roster" id="school-roster"><div className="school-heading"><div><span className="school-eyebrow">Raporty grupy</span><h2>Kursanci ({visible.length})</h2></div>{filter ? <button onClick={() => setFilter(null)}>Pokaż wszystkich</button> : null}</div>{filter ? <p>Wybrany obszar: {summary.problems.find(p => p.key === filter)?.label}</p> : null}<div className="school-student-list"><table className="school-students-table"><caption className="school-table-caption">Kursanci w wybranej grupie</caption><thead><tr><th scope="col" aria-sort={sortState("name")}><button type="button" className="school-sort-button" onClick={() => changeSort("name")}>Imię i nazwisko <span aria-hidden="true">{sortArrow("name")}</span></button></th><th scope="col" aria-sort={sortState("score")}><button type="button" className="school-sort-button" onClick={() => changeSort("score")}>Ocena <span aria-hidden="true">{sortArrow("score")}</span></button></th><th scope="col">Najważniejsza rzecz do poprawy</th><th scope="col">Raport</th></tr></thead><tbody>{visible.map(p => <tr className="school-student" key={p.id}><td><span className="school-student-name"><strong>{p.name}</strong><ContactActions contact={p.contact} name={p.name} onPrepareEmail={email => void openReport(p.id, undefined, email)}/></span>{p.sample ? <span className="school-sample-label">{p.sample.title}</span> : null}{demo && p.sample ? <div className="school-demo-downloads"><a className="button school-cv-download" href={p.sample.sourceUrl} download={`${p.name}-przed.pdf`} aria-label={`Pobierz CV${p.sample.revision ? " przed poprawkami" : ""}: ${p.name}`}><Download aria-hidden="true"/>{p.sample.revision ? "PDF przed" : "CV (PDF)"}</a>{p.sample.revision ? <a className="button school-cv-download" href={p.sample.revision.sourceUrl} download={`${p.name}-po.pdf`} aria-label={`Pobierz CV po poprawkach: ${p.name}`}><Download aria-hidden="true"/>PDF po</a> : null}</div> : null}<small>{demo ? "Raport przykładowy" : p.paid ? "Pełny raport" : p.testAccess ? "Raport testowy · bez płatności" : "Podgląd bezpłatny"}</small></td><td className="school-student-score" data-label="Ocena CV">{p.initialReport ? <span>{p.initialReport.summary.overallScore} → </span> : null}{p.report?.summary.overallScore ?? "Brak oceny"}{p.report ? "/100" : ""}</td><td className="school-student-issue" data-label="Do poprawy">{p.report?.summary.biggestRisk || "Pełna diagnoza dostępna po aktywacji dostępu szkoły"}</td><td><button className="button button-primary school-report-button" disabled={busy} type="button" onClick={() => void openReport(p.id)}>Raport <ArrowRight size={16} strokeWidth={2} aria-hidden="true"/></button></td></tr>)}</tbody></table></div>{!visible.length ? <p className="school-muted">{filter ? "Brak CV w wybranym obszarze." : "W tej grupie nie ma jeszcze CV."}</p> : null}</section>
      <div className="school-section-heading"><span className="school-eyebrow">Podsumowanie grupy</span><h2>Gdzie warto skupić warsztat?</h2><p className="school-muted">Wspólne obszary do omówienia na podstawie odblokowanych raportów.</p></div>
      <div className="school-grid">
        <section className="school-card">
          <h2>Rozkład ocen</h2>
          {summary.count && summary.comparable ? summary.bins.map((count, i) => <div key={i}><div className="school-meter-label"><span>{summary.binLabels[i]}</span><strong>{count} z {summary.count}</strong></div><div className="school-track"><div style={{ width: `${count / summary.count * 100}%` }}/></div></div>) : <p className="school-muted">Odblokuj raporty, aby zobaczyć podsumowanie.</p>}
        </section>
        <section className="school-card">
          <h2>Priorytety pracy z grupą</h2>
          {summary.problems.length ? <>
            <p className="school-muted">Kliknij obszar, aby zobaczyć konkretne CV do omówienia na warsztacie.</p>
            {summary.problems.map(p => <button className="school-problem" key={p.key} onClick={() => { setFilter(p.key); document.getElementById("school-roster")?.scrollIntoView?.({ block: "start", behavior: "instant" }); }}><span>{p.label}</span><small>{p.count} z {summary.count} CV · {Math.round(p.count / summary.count * 100)}%</small></button>)}
            <small>Ważne i krytyczne problemy. Jedno CV liczy się raz w każdym obszarze.</small>
          </> : <p className="school-muted">{!summary.comparable ? "Brak porównywalnych raportów." : summary.count ? "W dostępnych raportach nie wskazano ważnych problemów." : "Odblokuj raporty, aby zobaczyć wspólne obszary do poprawy."}</p>}
        </section>
        <section className="school-card school-category-card">
          <h2>Oceny według obszaru</h2>
          <div className="school-category-grid">{summary.categories.map(c => <Meter key={c.key} label={c.label} value={c.score}/>)}</div>
          {!summary.categories.length ? <p className="school-muted">Brak porównywalnych raportów.</p> : null}
        </section>
      </div>

      {demo ? <AnimatedDetails className="school-card school-demo-method"><summary>O danych i kryteriach tego demo</summary><div className="school-method-content"><span className="school-eyebrow">Jak przygotowaliśmy tę grupę</span><h2>{data.groupId === "demo-guided-iterations" ? "Od ogólników do konkretnych dowodów" : "Różne CV. Jedne kryteria."}</h2>{data.groupId === "demo-guided-iterations" ? <p>Każda historia zaczyna się od słabo opisanego CV. Pierwszy raport wskazuje braki i przygotowuje pytania. Odpowiedzi pochodzą z rejestru faktów ustalonego przed analizą. Symulując kursantów, samodzielnie poprawiliśmy opisy według rad, bez dodawania doświadczenia. Analizy wykonaliśmy modelem GPT-6 Luna, tym samym promptem i kryteriami. W tej grupie {data.students.filter(item => item.latestVersion === 1).length} osób ma już raport po poprawce, a {data.students.filter(item => !item.latestVersion).length} czekają na przesłanie drugiej wersji CV. W panelu widzisz rzeczywiste wyniki, a w raporcie obu wersji dowody, uwagi oraz pytania i odpowiedzi.</p> : <p>Dokumenty obejmują projekty zespołowe i samodzielne, krótki staż, zmianę branży, CV po angielsku oraz opisy z małą ilością dowodów. Pierwotne PDF-y przeszły odczyt tekstu i rzeczywistą analizę AI. Oceny i podsumowanie wynikają z raportów, nie z ręcznie ustawionych wyników. Podglądy prezentują pięć autorskich szablonów z zachowaną treścią. Raport i ATS dotyczą pierwotnego pliku, dostępnego do pobrania. W grupie „Anna · przed i po poprawkach” znajdziesz dwie świeże analizy AI tych samych faktów, z oceną, ATS i uwagami dla każdej wersji. Poprawka powstała po odpowiedziach na pytania z panelu, na podstawie z góry ustalonych fikcyjnych faktów. Nie mieszamy tej pary z archiwalnymi ocenami pozostałych CV.</p>}<p className="school-muted">Wspólny cel: pierwsza praca jako Frontend Developer. Otwórz raport, porównaj diagnozę ze źródłowym PDF i sprawdź konkretne cytaty. To przykłady działania analizy, nie potwierdzenie umiejętności fikcyjnych osób.</p></div></AnimatedDetails> : null}
      </> : <>
      <div className="school-heading"><div><span className="school-eyebrow">Raport kursanta</span><div className="school-student-name school-report-name"><h1>{student?.name || "Raport CV"}</h1><ContactActions contact={student?.contact} name={student?.name || "Kursant"} onPrepareEmail={email => selected && void openReport(selected, undefined, email)}/></div><p>{group?.name}</p></div><div className="school-actions">{report && (report.fullAccess ?? report.paid) ? <button type="button" onClick={() => window.print()}>Drukuj / zapisz PDF</button> : null}<button className="school-back-button" onClick={() => { ++reportRequest.current; setView("group"); }}><ArrowLeft size={16} strokeWidth={2} aria-hidden="true"/>Wróć do grupy</button></div></div><div className="school-card school-switcher"><SchoolSelect label="Kursant" value={selected || ""} options={data.students.map(p => ({ id: p.id, label: p.name, mark: String(p.report?.summary.overallScore ?? "?"), markDescription: p.report ? `Ocena CV: ${p.report.summary.overallScore} na 100` : "Ocena CV niedostępna" }))} onChange={id => void openReport(id)}/><div className="school-actions"><button disabled={data.students.findIndex(p => p.id === selected) <= 0} onClick={() => void openReport(data.students[data.students.findIndex(p => p.id === selected) - 1].id)}>← Poprzedni</button><button disabled={data.students.findIndex(p => p.id === selected) >= data.students.length - 1} onClick={() => void openReport(data.students[data.students.findIndex(p => p.id === selected) + 1].id)}>Następny →</button></div></div>
      {report ? <SchoolReportNavigation>
        {!report.demoRevisionPreview ? <><a href="#school-report-overview">Podsumowanie</a>{(report.fullAccess ?? report.paid) || (report.report as TeaserReport).featuredIssue ? <a href="#school-diagnosis">Diagnoza</a> : null}{(report.fullAccess ?? report.paid) ? <><a href="#school-areas">Oceny obszarów</a><a href="#school-fixes">Poprawki</a><a href="#school-action-plan">Plan działania</a></> : null}</> : null}
        {demo && student?.sample ? <a href="#school-source">Źródłowe CV</a> : null}
        {(report.fullAccess ?? report.paid) ? <a href="#school-report-tools">Praca z kursantem</a> : null}
      </SchoolReportNavigation> : null}
      {report?.demoRevisionPreview && student?.sample?.revision ? <section className="school-card school-demo-revision"><span className="school-eyebrow">Przykład iteracji · redakcja CV</span><h2>Co zmieniło się po poprawkach?</h2><p>To poprawka oparta wyłącznie na faktach z pierwszego CV. Nie wykonaliśmy nowej analizy AI, dlatego ta wersja nie ma nowej oceny ani wyniku ATS i nie zmienia podsumowania grupy.</p><a className="button" href={student.sample.revision.sourceUrl} download>Pobierz poprawione CV (PDF)</a>{student.sample.revision.changes.map(change => <article className="school-finding" key={change.title}><h3>{change.title}</h3><div className="school-demo-comparison"><div><h4>Przed</h4><SchoolQuote formatted>{change.before}</SchoolQuote></div><div><h4>Po</h4><SchoolQuote formatted>{change.after}</SchoolQuote></div></div><p>{change.note}</p></article>)}<p className="school-muted">Nadal do uzupełnienia: sposób sprawdzenia formularza i decyzje dotyczące struktury kodu. Nie dopisujemy tych informacji bez potwierdzenia kursantki.</p></section> : report ? <IndividualReport data={displayReport!} demo={demo}/> : !error ? <p role="status">Wczytywanie raportu…</p> : null}
      {demo && student?.sample ? <section className="school-card school-source" id="school-source"><span className="school-eyebrow">Dokument i kontekst</span><h2>{student.sample.title}</h2><p>{student.sample.description}</p><p className="school-muted">Fikcyjne CV przeanalizowane {schoolDate(student.sample.analyzedAt)} tymi samymi kryteriami co pozostałe dokumenty w grupie. Projekty i kontakty są przykładowe.</p><div className="school-actions"><a className="button" href={sampleSourceUrl} download>{sampleDocumentLabel === "Źródłowe CV" ? "Pobierz źródłowe CV (PDF)" : `Pobierz ${sampleDocumentLabel} (PDF)`}</a>{!student.sample.revision && student.sample.displayUrl && student.sample.displayUrl !== sampleSourceUrl ? <a href={student.sample.displayUrl} download>Pobierz CV w szablonie podglądu (PDF)</a> : null}</div><p className="school-muted">Szablon: {student.sample.template}. {student.sample.revision?.analysis ? "Raport, ATS i podgląd dotyczą PDF-a wybranej wersji. Analizowany plik jest dostępny do pobrania." : student.sample.displayUrl && student.sample.displayUrl !== student.sample.sourceUrl ? "Układ podglądu jest nowy; analiza treści i ATS pochodzą z pierwotnego PDF-a." : "Raport, ATS i podgląd dotyczą tego samego PDF-a."}</p><SchoolPdfPreview key={`${student.id}:${report?.version || 0}`} sourceUrl={samplePreviewUrl || student.sample.sourceUrl} name={student.name} label={sampleDocumentLabel}/></section> : null}
      <div id="school-report-tools" className="school-report-tools">
      {report && (report.fullAccess ?? report.paid) && student ? <SchoolRevisionTools id={student.id} data={report} demo={demo} onVersion={version => changeVersion(version, student.id)}/> : null}
      {report && !report.demoRevisionPreview && (report.version || 0) < SCHOOL_PILOT.rechecks && (report.fullAccess ?? report.paid) && student ? <SchoolRevisionQuestions key={`questions:${student.id}:${report.version || 0}`} report={report.report as CVReport} version={report.version || 0} method={answerMethod} saved={currentAnswers} onSave={answerScope ? rememberAnswers : undefined}/> : null}
      {report && !report.demoRevisionPreview && (report.fullAccess ?? report.paid) && student ? <FeedbackComposer key={`mail:${student.id}:${report.version || 0}`} student={student} schoolName={data.schoolName} report={displayReport!.report as CVReport} activation={feedbackTarget?.id === student.id ? feedbackTarget : undefined}/> : null}
      </div>
      {demo && student?.sample?.revision?.analysis && report ? <SchoolRevisionComparison sample={student.sample}/> : null}

      {report && !(report.fullAccess ?? report.paid) ? <section className="school-card"><h2>Dostęp do pełnego raportu</h2><p>Pełny raport będzie dostępny po aktywacji dostępu szkoły. Warunki współpracy i rozliczenie na podstawie faktury ustalamy bezpośrednio.</p><div className="school-actions"><Link className="button" href="/dla-szkol#kontakt">Ustal dostęp dla szkoły</Link><button disabled={busy} onClick={() => selected && void openReport(selected)}>Odśwież dostęp</button></div></section> : null}
      {!demo && selected && report && (report.fullAccess ?? report.paid) ? <SchoolReportRating key={`rating:${selected}:${report.version || 0}`} id={selected} version={report.version || 0}/> : null}
      {!demo && selected ? <div className="school-actions"><button disabled={busy} aria-haspopup="dialog" onClick={() => { setError(""); setDeleteReportOpen(true); }}>Usuń raport kursanta</button></div> : null}
      </>}
    </main></div>{deleteReportOpen && selected ? <ConfirmationDialog title="Usunąć raport kursanta?" description="Usuniemy raport kursanta i powiązane dane. Tej operacji nie można cofnąć." confirmLabel="Usuń raport" busy={busy} error={error} onCancel={() => { if (!busy) { setDeleteReportOpen(false); setError(""); } }} onConfirm={() => void removeReport()}/> : null}{newGroup ? <CreateGroupDialog busy={busy} error={error} onCancel={() => { if (!busy) { setNewGroup(false); setError(""); } }} onSubmit={createGroup}/> : null}{deleteGroupOpen && group ? <DeleteGroupDialog name={group.name} busy={busy} error={error} onCancel={() => { if (!busy) { setDeleteGroupOpen(false); setError(""); } }} onConfirm={() => void removeGroup()}/> : null}</div>;
}

function IndividualReport({ data, demo = false }: { data: SchoolReport; demo?: boolean }) {
  if (!(data.fullAccess ?? data.paid)) {
    const teaser = data.report as TeaserReport;
    return <section className="school-card" id="school-report-overview"><h2>Bezpłatny wynik wstępny</h2><p>{teaser.profileSummary}</p><p>{teaser.firstImpression}</p>{teaser.featuredIssue ? <><h3 id="school-diagnosis">{teaser.featuredIssue.title}</h3><SchoolQuote>{teaser.featuredIssue.evidence}</SchoolQuote><p>{teaser.featuredIssue.interpretation}</p><p>{teaser.featuredIssue.actionDirection}</p></> : null}{!demo ? <p>Raport wygasa: {schoolDate(data.expiresAt)}</p> : null}<AtsPanel ats={teaser.ats} locale="pl"/></section>;
  }
  const report = data.report as CVReport;
  return <div className="school-report-analysis"><div id="school-report-overview"><div className="school-stats school-report-summary"><section className="school-card school-score-card"><span>Jakość komunikacji CV</span><strong>{report.summary.overallScore}<span className="school-score-unit">/100</span></strong><small>{report.summary.oneSentenceVerdict}</small></section><section className="school-card"><h2>Mocny sygnał</h2><p>{report.summary.strongestSignal}</p></section><section className="school-card"><h2>Główna rzecz do poprawy</h2><p>{report.summary.biggestRisk}</p></section></div></div><section className="school-card school-recruiter-card" id="school-diagnosis"><span className="school-eyebrow">Odbiór dokumentu</span><h2>Perspektywa rekrutera</h2><p>{report.recruiterPerspective.profileSummary}</p><p>{report.recruiterPerspective.seniorityAlignmentExplanation}</p><div className="school-signal-grid"><div className="school-signal-panel"><h3>Mocne sygnały</h3><ul>{report.recruiterPerspective.positiveSignals.map(signal => <li key={signal.title}><strong>{signal.title}</strong><p>{signal.explanation}</p></li>)}</ul></div><div className="school-signal-panel"><h3>Rezerwy do wyjaśnienia</h3><ul>{report.recruiterPerspective.reservations.map(reservation => <li key={reservation.title}><strong>{reservation.title}</strong><p>{reservation.explanation}</p></li>)}</ul></div></div><h3>Pytania na rozmowę</h3><ol>{report.recruiterPerspective.likelyInterviewQuestions.map((q,i) => <li key={i}><strong>{q.question}</strong><p>{q.whyThisQuestion}</p></li>)}</ol></section><section className="school-card school-impression"><h2>Pierwsze wrażenie</h2><div className="school-impression-grid">{[report.recruiterSimulation.after5Seconds,report.recruiterSimulation.after10Seconds,report.recruiterSimulation.after20Seconds].map((text,i) => <div className="school-impression-step" key={i}><h3>Po {[5,10,20][i]} sekundach</h3><p>{text}</p></div>)}</div><p className="school-muted">Symulacja odbioru dokumentu, nie decyzja rekrutacyjna ani ocena kompetencji kursanta.</p></section><section className="school-card"><AtsPanel ats={report.ats} locale="pl"/></section><section className="school-card" id="school-areas"><h2>Oceny według obszaru</h2><div className="school-area-grid">{report.categoryScores.map(c => <div key={c.key}><Meter label={c.label} value={c.score}/><p className="school-muted">{c.rationale}</p></div>)}</div></section><section className="school-card school-strengths"><h2>Mocne strony dokumentu</h2>{report.strengths.map(s => <div key={s.id}><h3>{s.title}</h3><p>{s.explanation}</p>{s.evidenceRefs.map(ref => report.evidenceMap?.[ref] ? <SchoolQuote key={ref}>{report.evidenceMap[ref]}</SchoolQuote> : null)}</div>)}</section><section className="school-card" id="school-fixes"><h2>Problemy i konkretne poprawki</h2>{!report.issues.length ? <p>W tej analizie nie wskazano problemów wymagających osobnej poprawki. Nie oznacza to gwarancji zatrudnienia ani niezależnej weryfikacji projektu.</p> : null}{report.issues.map(issue => <article className="school-finding" key={issue.id}><span className={`school-badge school-severity-${issue.severity}`}>{severityLabels[issue.severity]}</span><h3>{issue.title}</h3>{issue.suggestion?.type === "gap" ? <p className="school-gap-note">Luka w opisie CV. Wniosek dotyczy informacji niewidocznych w dokumencie, nie braku umiejętności osoby.</p> : null}{issue.evidenceRefs.map(ref => report.evidenceMap?.[ref] ? <SchoolQuote key={ref}>{report.evidenceMap[ref]}</SchoolQuote> : null)}<p>{issue.explanation}</p><p className="school-muted">{issue.whyItMatters}</p><p className="school-muted">Pewność diagnozy: {{ high: "wysoka", medium: "średnia", low: "niska" }[issue.confidence]}</p><div className="school-finding-action"><h4>Co poprawić</h4><p>{issue.action}</p></div>{issue.suggestion?.factualityNote ? <p className="school-muted">{issue.suggestion.factualityNote}</p> : null}</article>)}</section><section className="school-card school-action-plan" id="school-action-plan"><h2>Plan działania</h2>{!report.nextSteps.length ? <p>Raport nie wskazał priorytetowych korekt. Przed aplikacją sprawdź aktualność CV i zgodność opisu z wymaganiami konkretnej oferty.</p> : null}<ol>{report.nextSteps.map((step, i) => <li key={i}><h3>{step.title}</h3><p>{step.action}</p></li>)}</ol></section><div className="school-card school-revision-brief"><RevisionGuidance locale="pl"/></div><section className="school-card school-limitations"><h2>Ograniczenia analizy</h2>{report.limitations.map((text, i) => <p key={i}>{text}</p>)}{!demo ? <p>Raport wygasa: {schoolDate(data.expiresAt)}</p> : null}</section></div>;
}
