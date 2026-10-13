'use client';

import { useTranslation } from 'react-i18next';

import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { PDFPrintableDirectory } from '@/app/(app)/shared/components/directory-print/pdf-printable-directory';
import { applyBookletPadding } from '@/app/(app)/shared/components/directory-print/applyBookletPadding';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getPrintableDirectoryPreview } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectoryPreview';
import {
  printableDirectoryPreviewToPdfData,
  type PrintableDirectoryPdfData,
} from '@/app/(app)/shared/utils/printable-directory-transformers';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

/**
 * Default print-time template when the dialog first opens. Ephemeral only —
 * never persisted. See docs/adr/0002-remove-resource-layout-and-booklet-fields.md.
 */
const DEFAULT_PRINT_VARIANT = 'line-listing';

type PrintPrintableDirectoryButtonProps = {
  directory: PrintableDirectoryResponseDto;
};

export function PrintPrintableDirectoryButton({
  directory,
}: PrintPrintableDirectoryButtonProps) {
  const appConfig = useAppConfig();
  const { i18n } = useTranslation();

  // Only locales the directory actually has translated content for are
  // selectable when printing — see docs/printable-directories.md ("A.II.
  // Localization & automatic translation"). This is always `directory.locales`
  // regardless of the printing user's own capability (capability only
  // matters at edit time).
  const initialLocale = directory.locales.includes(i18n.language)
    ? i18n.language
    : directory.primaryLanguage;

  const loadData = async (
    locale: string,
  ): Promise<PrintableDirectoryPdfData> => {
    const preview = await getPrintableDirectoryPreview(
      directory.id,
      locale,
      appConfig.tenantId,
    );

    if (!preview) {
      throw new Error('Failed to load printable directory preview');
    }

    return printableDirectoryPreviewToPdfData(preview, locale);
  };

  return (
    <DirectoryPrintControl<PrintableDirectoryPdfData>
      loadData={loadData}
      initialVariant={DEFAULT_PRINT_VARIANT}
      availableLocales={directory.locales}
      initialLocale={initialLocale}
      testId="print-printable-directory-btn"
      renderDocument={(data, context) => (
        <PDFPrintableDirectory
          data={data}
          {...context}
          brandLogoUrl={appConfig.brand.logoUrl}
        />
      )}
      postProcessBlob={(blob, _data, isBookletLayout) =>
        isBookletLayout ? applyBookletPadding(blob) : Promise.resolve(blob)
      }
    />
  );
}
