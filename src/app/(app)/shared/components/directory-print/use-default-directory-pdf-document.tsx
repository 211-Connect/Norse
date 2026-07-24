'use client';

import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { type PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';

import { PDFDirectory } from './pdf-directory';
import { type PdfDocumentElement } from './print-directory-dialog';

/**
 * Default `renderDocument` for the flat item-list printable directory PDF
 * (favorites, search results, single resource) — brand logo + app-wide
 * disclaimer footer, no cover/sections/booklet.
 */
export function useDefaultDirectoryPdfDocument() {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();

  return (
    data: PrintableDirectoryData,
    context: {
      variant: 'line-listing' | 'summary-listing' | 'full-listing';
      fontSizeMode: 'default' | 'large';
      currentDomain: string;
      currentDate: string;
    },
  ): PdfDocumentElement => (
    <PDFDirectory
      {...context}
      data={data}
      brandLogoUrl={appConfig.brand.logoUrl}
      disclaimerText={t('print_footer_disclaimer', {
        brandName: appConfig.brand.name,
        interpolation: { escapeValue: false },
      })}
    />
  );
}
