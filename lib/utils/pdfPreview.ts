/**
 * Render the first page of a PDF to a data URL image.
 * @param url - URL to the PDF file
 * @param targetWidth - Target width for the rendered image (default: 420)
 * @returns Data URL of the rendered image, or null if rendering fails
 */
export async function renderPdfFirstPage(url: string, targetWidth = 420): Promise<string | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    const { getDocument, GlobalWorkerOptions } = pdfjs;
    // Set worker source to local file
    GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const loadingTask = getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Fill background so transparent PDF areas don't show dark gaps
    context!.fillStyle = '#ffffff';
    context!.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context!,
      viewport: scaledViewport,
      canvas
    } as Parameters<typeof page.render>[0]).promise;

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('PDF preview render failed:', err);
    return null;
  }
}
