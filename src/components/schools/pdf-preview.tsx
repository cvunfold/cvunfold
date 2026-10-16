"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { SCHOOL_DEMO_PREVIEW_IMAGES } from "@/lib/schools/demo-preview-images";

/** Pre-rendered from the public fictional source PDF. No third-party viewer or upload. */
export function SchoolPdfPreview({ sourceUrl, name, label = "Źródłowe CV" }: { sourceUrl: string; name: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const id = useId();
  return <div className="school-pdf-preview">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{open ? "Ukryj podgląd PDF" : "Pokaż podgląd PDF"}</button>
    {open ? <div id={id} className="school-pdf-viewer">
      <div className="school-pdf-toolbar"><span>{label} · strona 1 z 1</span><div className="school-actions"><button type="button" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? "Dopasuj do szerokości" : "Powiększ"}</button><a href={sourceUrl} target="_blank" rel="noopener noreferrer">Otwórz PDF ↗</a></div></div>
      <div className="school-pdf-canvas" role="region" aria-label={`Podgląd PDF: ${name}`} tabIndex={0}><Image className={zoom ? "school-pdf-page zoomed" : "school-pdf-page"} src={SCHOOL_DEMO_PREVIEW_IMAGES[sourceUrl] || sourceUrl.replace(/\.pdf$/, ".png")} width={1131} height={1600} alt={`Strona 1 · ${label}: ${name}`} unoptimized/></div>
      <p className="school-muted">Podgląd pokazuje stronę wybranego PDF-a. Możesz go powiększyć lub otworzyć w osobnej karcie.</p>
    </div> : null}
  </div>;
}
