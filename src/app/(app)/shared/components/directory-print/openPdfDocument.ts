import { pdf } from '@react-pdf/renderer';

import { type PdfDocumentElement } from './print-directory-dialog';

export type OpenPdfDocumentResult =
  { ok: true } | { ok: false; reason: 'popup_blocked' | 'unknown' };

/**
 * Renders a react-pdf document to a Blob, opens it in a new browser tab/window,
 * and triggers the native print dialog once the PDF has loaded. Shared by the
 * authenticated "Print" flow and the public share preview page so both produce
 * an identical result.
 */
export async function openPdfDocument(
  documentElement: PdfDocumentElement,
  options?: { postProcessBlob?: (blob: Blob) => Promise<Blob> },
): Promise<OpenPdfDocumentResult> {
  try {
    let blob = await pdf(documentElement).toBlob();

    if (options?.postProcessBlob) {
      blob = await options.postProcessBlob(blob);
    }

    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      window.URL.revokeObjectURL(url);
      return { ok: false, reason: 'popup_blocked' };
    }

    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    });

    const cleanup = () => window.URL.revokeObjectURL(url);
    printWindow.addEventListener('beforeunload', cleanup);
    setTimeout(cleanup, 10 * 60 * 1000);

    return { ok: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { ok: false, reason: 'unknown' };
  }
}

export type DownloadPdfDocumentResult =
  { ok: true } | { ok: false; reason: 'unknown' };

/**
 * Renders a react-pdf document to a Blob and triggers a direct file download
 * via a temporary anchor element (no new tab/window). Unlike `openPdfDocument`,
 * this does not rely on `window.open`, so it isn't subject to popup blockers
 * and is safe to call without a direct user click (e.g. on page load).
 */
export async function downloadPdfDocument(
  documentElement: PdfDocumentElement,
  fileName: string,
  options?: { postProcessBlob?: (blob: Blob) => Promise<Blob> },
): Promise<DownloadPdfDocumentResult> {
  try {
    let blob = await pdf(documentElement).toBlob();

    if (options?.postProcessBlob) {
      blob = await options.postProcessBlob(blob);
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);

    return { ok: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { ok: false, reason: 'unknown' };
  }
}
