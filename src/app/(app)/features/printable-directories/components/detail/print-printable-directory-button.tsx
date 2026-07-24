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

const RESOURCE_LAYOUT_TO_PRINT_VARIANT = {
  line: 'line-listing',
  summary: 'summary-listing',
  full: 'full-listing',
} as const;

type PrintPrintableDirectoryButtonProps = {
  directory: PrintableDirectoryResponseDto;
};

export function PrintPrintableDirectoryButton({
  directory,
}: PrintPrintableDirectoryButtonProps) {
  const { i18n } = useTranslation();
  const appConfig = useAppConfig();

  if (
    directory.resourceLayout === 'custom-search' ||
    directory.resourceLayout === 'custom-resource'
  ) {
    return null;
  }

  const initialVariant =
    RESOURCE_LAYOUT_TO_PRINT_VARIANT[directory.resourceLayout];

  const loadData = async (): Promise<PrintableDirectoryPdfData> => {
    const preview = await getPrintableDirectoryPreview(
      directory.id,
      i18n.language,
      appConfig.tenantId,
    );

    if (!preview) {
      throw new Error('Failed to load printable directory preview');
    }

    return printableDirectoryPreviewToPdfData(preview, i18n.language);
  };

  return (
    <DirectoryPrintControl<PrintableDirectoryPdfData>
      data={null}
      loadData={loadData}
      initialVariant={initialVariant}
      testId="print-printable-directory-btn"
      renderDocument={(data, context) => (
        <PDFPrintableDirectory
          data={data}
          {...context}
          brandLogoUrl={appConfig.brand.logoUrl}
        />
      )}
      postProcessBlob={(blob, data) =>
        data.isBookletLayout ? applyBookletPadding(blob) : Promise.resolve(blob)
      }
    />
  );
}
