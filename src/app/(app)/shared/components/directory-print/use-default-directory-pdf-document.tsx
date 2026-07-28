'use client';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { type PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';

import { PDFDirectory } from './pdf-directory';
import {
  type PdfDocumentElement,
  type PrintDocumentRenderContext,
} from './print-directory-dialog';

/**
 * Default `renderDocument` for the flat item-list printable directory PDF
 * (favorites, search results, single resource) — brand logo + app-wide
 * disclaimer footer, no cover/sections/booklet.
 */
export function useDefaultDirectoryPdfDocument() {
  const appConfig = useAppConfig();

  return (
    data: PrintableDirectoryData,
    context: PrintDocumentRenderContext,
  ): PdfDocumentElement => (
    <PDFDirectory
      {...context}
      data={data}
      brandLogoUrl={appConfig.brand.logoUrl}
      brandName={appConfig.brand.name}
      ctaText={appConfig.brand.ctaText}
    />
  );
}
