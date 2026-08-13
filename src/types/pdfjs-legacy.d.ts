declare module "pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js" {
  const pdfJs: {
    version: string;
    disableWorker: boolean;
    getDocument(data: Uint8Array): PromiseLike<unknown>;
  };
  export default pdfJs;
}
