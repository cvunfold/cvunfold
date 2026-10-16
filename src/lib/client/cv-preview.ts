import { validateDocxArchive } from "@/lib/security/upload";

export type CvPreview = { kind: "pdf"; pages: number } | { kind: "docx"; text: string };

/** The selected file stays in browser memory. This preview performs no upload. */
export async function renderCvPreview(file: File, canvas: HTMLCanvasElement, signal: AbortSignal): Promise<CvPreview> {
  if (!file.size || file.size > 8 * 1024 * 1024) throw new Error("PREVIEW_UNAVAILABLE");
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal.throwIfAborted();

  if (/\.docx$/i.test(file.name)) {
    validateDocxArchive(bytes);
    const mammoth = await import("mammoth/mammoth.browser");
    signal.throwIfAborted();
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    signal.throwIfAborted();
    if (!result.value.trim()) throw new Error("PREVIEW_UNAVAILABLE");
    return { kind: "docx", text: result.value.slice(0, 8000) };
  }

  if (!/\.pdf$/i.test(file.name) || ![0x25, 0x50, 0x44, 0x46].every((byte, index) => bytes[index] === byte)) throw new Error("PREVIEW_UNAVAILABLE");
  const pdfjs = await import("pdfjs-dist");
  signal.throwIfAborted();
  const port = new Worker(new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url), { type: "module" });
  const worker = pdfjs.PDFWorker.create({ port });
  const task = pdfjs.getDocument({
    data: bytes, worker, verbosity: 0, useWorkerFetch: false,
    disableFontFace: true, useSystemFonts: true, enableXfa: false,
    maxImageSize: 8_000_000, canvasMaxAreaInBytes: 8_000_000,
  });
  let render: ReturnType<import("pdfjs-dist").PDFPageProxy["render"]> | undefined;
  let interrupt: (reason: unknown) => void = () => undefined;
  const interrupted = new Promise<never>((_, reject) => { interrupt = reject; });
  const cancel = () => { render?.cancel(); interrupt(signal.reason); };
  signal.addEventListener("abort", cancel, { once: true });
  // A password prompt must never hold up the separate analysis request.
  task.onPassword = () => interrupt(new Error("PREVIEW_UNAVAILABLE"));
  try {
    const pdf = await Promise.race([task.promise, interrupted]);
    signal.throwIfAborted();
    const page = await pdf.getPage(1);
    signal.throwIfAborted();
    const naturalSize = page.getViewport({ scale: 1 });
    const scale = Math.min(760 / naturalSize.width, 1100 / naturalSize.height);
    if (!Number.isFinite(scale) || scale <= 0) throw new Error("PREVIEW_UNAVAILABLE");
    const viewport = page.getViewport({ scale });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    render = page.render({ canvas, viewport, annotationMode: pdfjs.AnnotationMode.DISABLE });
    await Promise.race([render.promise, interrupted]);
    signal.throwIfAborted();
    return { kind: "pdf", pages: pdf.numPages };
  } finally {
    signal.removeEventListener("abort", cancel);
    await task.destroy().catch(() => undefined);
    worker.destroy();
    port.terminate();
  }
}
