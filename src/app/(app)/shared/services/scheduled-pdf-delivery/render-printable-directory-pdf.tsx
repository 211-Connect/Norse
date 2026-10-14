import { renderToBuffer } from '@react-pdf/renderer';
import { I18nextProvider } from 'react-i18next';

import { applyBookletPaddingToBytes } from '@/app/(app)/shared/components/directory-print/applyBookletPadding';
import { PdfFontProvider } from '@/app/(app)/shared/components/directory-print/pdf-fonts';
import { PDFPrintableDirectory } from '@/app/(app)/shared/components/directory-print/pdf-printable-directory';
import { createPrintI18nInstance } from '@/app/(app)/shared/components/directory-print/print-i18n';
import { printableDirectoryPreviewToPdfData } from '@/app/(app)/shared/utils/printable-directory-transformers';
import {
  PrintableDirectoryDeliveryPrintOptionsDto,
  PrintableDirectoryPreviewResponseDto,
} from '@/lib/api/generated/data-contracts';

export type RenderPrintableDirectoryPdfOptions = {
  preview: PrintableDirectoryPreviewResponseDto;
  print: PrintableDirectoryDeliveryPrintOptionsDto;
  /** The tenant's default locale, the fallback for static PDF text. */
  defaultLocale: string;
  /** Printed where the header/footer layout includes the domain. */
  currentDomain: string;
  /** Printed where the header/footer layout includes the date. */
  currentDate: string;
  brandLogoUrl?: string;
};

/**
 * Renders a printable directory PDF in Node, producing the same document as
 * the browser print dialog (docs/scheduled-pdf-delivery.md). Imported only
 * by `src/pages/api/internal/printable-directory-pdf.ts`; other server code
 * calls that route through `requestPrintableDirectoryPdf`.
 */
export async function renderPrintableDirectoryPdf({
  preview,
  print,
  defaultLocale,
  currentDomain,
  currentDate,
  brandLogoUrl,
}: RenderPrintableDirectoryPdfOptions): Promise<Uint8Array> {
  const printI18n = await createPrintI18nInstance(print.locale, defaultLocale);

  const buffer = await renderToBuffer(
    <PdfFontProvider locale={print.locale}>
      <I18nextProvider i18n={printI18n}>
        <PDFPrintableDirectory
          data={printableDirectoryPreviewToPdfData(preview, print.locale)}
          variant={print.variant}
          fontSizeMode={print.fontSize}
          currentDomain={currentDomain}
          currentDate={currentDate}
          brandLogoUrl={brandLogoUrl}
          isBookletLayout={print.booklet}
        />
      </I18nextProvider>
    </PdfFontProvider>,
  );

  const bytes = new Uint8Array(buffer);
  return print.booklet ? applyBookletPaddingToBytes(bytes) : bytes;
}
