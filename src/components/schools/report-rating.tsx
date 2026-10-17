"use client";
import { FormSelect } from "@/components/form-select";
import { StarRating } from "@/components/star-rating";
import { useState, useRef, type FormEvent } from "react";
export function SchoolReportRating({ id, version }: { id: string; version: number }) {
  const [sent,setSent]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const submission = useRef<{ payload: string; id: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form=new FormData(event.currentTarget);
    const values={version,rating:Number(form.get("rating")),accurate:form.get("accurate"),comment:form.get("comment")}, payload=JSON.stringify(values);
    if(submission.current?.payload!==payload) submission.current={payload,id:crypto.randomUUID()};
    try { const response=await fetch(`/api/schools/reports/${encodeURIComponent(id)}/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,requestId:submission.current!.id})}); if(!response.ok) throw new Error((await response.json()).error); setSent(true); }
    catch(caught){setError(caught instanceof Error ? caught.message : "Nie udało się zapisać oceny.");}finally{setBusy(false);}
  }
  return <section className="school-card school-rating"><h2>Czy ta wersja analizy była trafna?</h2>{sent ? <p role="status">Dziękujemy za ocenę.</p> : <form className="school-form" onSubmit={submit}><StarRating disabled={busy}/><FormSelect label="Trafność" name="accurate" disabled={busy} options={[{ id: "yes", label: "Tak" }, { id: "partly", label: "Częściowo" }, { id: "no", label: "Nie" }]}/><label>Komentarz<textarea name="comment" maxLength={1000} disabled={busy}/></label><p className="school-muted">Komentarz przekazujemy mailowo właścicielowi CVUnfold. Nie wpisuj danych kontaktowych ani fragmentów CV. Oddzielna kopia komentarza może być przechowywana do 90 dni zgodnie z polityką prywatności.</p><button className="button" disabled={busy}>{busy ? "Zapisywanie…" : "Wyślij ocenę"}</button></form>}{error ? <p role="alert" className="school-error">{error}</p> : null}</section>;
}
