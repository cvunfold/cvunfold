"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, LockKeyhole, ScanLine } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { renderCvPreview, type CvPreview } from "@/lib/client/cv-preview";
import { DocumentScanner } from "./document-scanner";

const copy = {
  pl: { title: "Twoje CV", preparing: "Przygotowujemy podgląd dokumentu", unavailable: "Podgląd niedostępny. Analiza trwa dalej.", docx: "Podgląd treści DOCX", page: "Strona 1 z", private: "Podgląd tylko na Twoim urządzeniu", scanning: "Analizujemy dokument", complete: "Analiza gotowa", alt: "Podgląd pierwszej strony przesłanego CV" },
  en: { title: "Your CV", preparing: "Preparing your document preview", unavailable: "Preview unavailable. Your review continues.", docx: "DOCX content preview", page: "Page 1 of", private: "Preview stays on your device", scanning: "Reviewing the document", complete: "Review complete", alt: "Preview of the first page of your uploaded CV" },
} as const;

export function UploadedCvPreview({ file, locale, complete = false }: { file: File; locale: Locale; complete?: boolean }) {
  const t = copy[locale];
  const canvas = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<CvPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const surface = canvas.current;
    if (!surface) return;
    setPreview(null);
    setFailed(false);
    void renderCvPreview(file, surface, controller.signal).then(result => {
      if (!controller.signal.aborted) setPreview(result);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => { controller.abort(); surface.width = 0; surface.height = 0; };
  }, [file]);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return <figure className="uploaded-cv-preview" data-preview={preview?.kind || (failed ? "unavailable" : "pending")} aria-label={t.title}>
    <div className="uploaded-cv-toolbar"><FileText aria-hidden="true"/><span>{file.name}</span><small>{preview?.kind === "pdf" ? `${t.page} ${preview.pages}` : preview?.kind === "docx" ? t.docx : t.title}</small></div>
    <div className="uploaded-cv-frame">
      <div className="uploaded-cv-paper">
        <div className="uploaded-cv-skeleton" aria-hidden="true">
          <div className="uploaded-cv-skeleton-heading"><i/><div><span/><span/></div></div>
          <div className="uploaded-cv-skeleton-contact"><span/><span/></div>
          {[0, 1, 2].map(section => <div className="uploaded-cv-skeleton-section" key={section}><b/><span/><span/><span/><span/></div>)}
        </div>
        <canvas ref={canvas} role="img" aria-label={t.alt} hidden={preview?.kind !== "pdf"}/>
        {preview?.kind === "docx" ? <div className="uploaded-cv-text">{preview.text.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}
        {!preview && failed ? <div className="uploaded-cv-placeholder"><FileText aria-hidden="true"/><p role="status">{t.unavailable}</p></div> : !preview ? <span className="uploaded-cv-sr-status" role="status">{t.preparing}</span> : <DocumentScanner paused={complete || !pageVisible}/>}
      </div>
      {preview ? <div className="uploaded-cv-status"><ScanLine aria-hidden="true"/>{complete ? t.complete : t.scanning}</div> : null}
    </div>
    <figcaption><LockKeyhole aria-hidden="true"/>{t.private}</figcaption>
  </figure>;
}
