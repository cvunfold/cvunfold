import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderCvPreview } from "@/lib/client/cv-preview";

const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), createWorker: vi.fn(), extractRawText: vi.fn() }));
vi.mock("pdfjs-dist", () => ({ getDocument: mocks.getDocument, PDFWorker: { create: mocks.createWorker }, AnnotationMode: { DISABLE: 0 } }));
vi.mock("mammoth/mammoth.browser", () => ({ extractRawText: mocks.extractRawText }));

const terminate = vi.fn();
const destroyWorker = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("Worker", class { terminate = terminate; });
  vi.stubGlobal("fetch", vi.fn());
  mocks.createWorker.mockReturnValue({ destroy: destroyWorker });
});
afterEach(() => vi.unstubAllGlobals());

function safeDocx() {
  // Only the central directory is needed to exercise the archive limits.
  const entries = ["[Content_Types].xml", "word/document.xml"].map(name => {
    const label = Buffer.from(name);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt32LE(20, 20);
    header.writeUInt32LE(20, 24);
    header.writeUInt16LE(label.length, 28);
    return Buffer.concat([header, label]);
  });
  const directory = Buffer.concat(entries);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(2, 10);
  end.writeUInt32LE(directory.length, 12);
  return new File([Buffer.concat([directory, end])], "cv.docx");
}

describe("local CV preview", () => {
  it("renders only the first PDF page with bounded dimensions, no upload and releases the worker", async () => {
    const surface = { width: 0, height: 0 } as HTMLCanvasElement;
    const render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
    const getPage = vi.fn(async () => ({ getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }), render }));
    const destroy = vi.fn(async () => undefined);
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 3, getPage }), destroy });
    const result = await renderCvPreview(new File(["%PDF-1.7\n"], "cv.pdf"), surface, new AbortController().signal);
    expect(result).toEqual({ kind: "pdf", pages: 3 });
    expect(getPage).toHaveBeenCalledExactlyOnceWith(1);
    expect(surface.width).toBeLessThanOrEqual(760);
    expect(surface.height).toBeLessThanOrEqual(1100);
    expect(render).toHaveBeenCalledWith(expect.objectContaining({ canvas: surface, annotationMode: 0 }));
    expect(mocks.getDocument).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Uint8Array), useWorkerFetch: false, disableFontFace: true, enableXfa: false }));
    expect(fetch).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledOnce();
    expect(destroyWorker).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("cancels a PDF render when the overlay closes", async () => {
    const controller = new AbortController();
    const cancel = vi.fn();
    const destroy = vi.fn(async () => undefined);
    let finish: (() => void) | undefined;
    const render = vi.fn(() => ({ promise: new Promise<void>(resolve => { finish = resolve; }), cancel }));
    mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 1, getPage: async () => ({ getViewport: () => ({ width: 600, height: 800 }), render }) }), destroy });
    const pending = renderCvPreview(new File(["%PDF-1.7\n"], "cv.pdf"), {} as HTMLCanvasElement, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());
    controller.abort();
    expect(cancel).toHaveBeenCalledOnce();
    finish?.();
    await rejected;
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("extracts safe DOCX text without converting document HTML or uploading it", async () => {
    mocks.extractRawText.mockResolvedValue({ value: "Candidate\n\n<script>Untrusted content</script>" });
    await expect(renderCvPreview(safeDocx(), {} as HTMLCanvasElement, new AbortController().signal)).resolves.toEqual({ kind: "docx", text: "Candidate\n\n<script>Untrusted content</script>" });
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.getDocument).not.toHaveBeenCalled();
  });

  it("releases a password-protected PDF instead of waiting for a password", async () => {
    const task = { promise: new Promise(() => undefined), destroy: vi.fn(async () => undefined), onPassword: undefined as (() => void) | undefined };
    mocks.getDocument.mockReturnValue(task);
    const pending = renderCvPreview(new File(["%PDF-1.7\n"], "cv.pdf"), {} as HTMLCanvasElement, new AbortController().signal);
    const rejected = expect(pending).rejects.toThrow("PREVIEW_UNAVAILABLE");
    await vi.waitFor(() => expect(task.onPassword).toBeTypeOf("function"));
    task.onPassword?.();
    await rejected;
    expect(task.destroy).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("rejects unsafe archives before DOCX extraction and forged PDFs before starting a worker", async () => {
    await expect(renderCvPreview(new File(["PK"], "cv.docx"), {} as HTMLCanvasElement, new AbortController().signal)).rejects.toThrow();
    await expect(renderCvPreview(new File(["forged"], "cv.pdf"), {} as HTMLCanvasElement, new AbortController().signal)).rejects.toThrow();
    expect(mocks.extractRawText).not.toHaveBeenCalled();
    expect(mocks.getDocument).not.toHaveBeenCalled();
  });
});
