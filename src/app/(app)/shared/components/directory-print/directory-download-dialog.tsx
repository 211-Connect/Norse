'use client';

import { AlertCircle, LoaderCircle } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { applyBookletPadding } from '@/app/(app)/shared/components/directory-print/applyBookletPadding';
import { downloadPdfDocument } from '@/app/(app)/shared/components/directory-print/openPdfDocument';
import { type PdfDocumentElement } from '@/app/(app)/shared/components/directory-print/print-directory-dialog';
import { PdfFontProvider } from '@/app/(app)/shared/components/directory-print/pdf-fonts';
import { PDFPrintableDirectory } from '@/app/(app)/shared/components/directory-print/pdf-printable-directory';
import { withCustomBasePathAppendedToDomain } from '@/app/(app)/shared/lib/utils';
import { type PrintVariant } from '@/app/(app)/shared/components/directory-print/pdf-print-primitives';
import {
  parseBookletLayoutParam,
  parseFontSizeModeParam,
  parsePrintVariantParam,
  PD_BOOKLET_PARAM,
  PD_FONT_SIZE_PARAM,
  PD_SLUG_PARAM,
  PD_VARIANT_PARAM,
} from '@/app/(app)/shared/components/directory-print/share-link-params';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getPrintableDirectoryPublicPreview } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectoryPublicPreview';
import { printableDirectoryPreviewToPdfData } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { PrintableDirectoryPreviewResponseDto } from '@/lib/api/generated/data-contracts';
import { createLogger } from '@/lib/logger';

const log = createLogger('DirectoryDownloadDialog');

/**
 * Default print-time template when no variant is specified in the share
 * link. Ephemeral only — never persisted. See
 * docs/adr/0002-remove-resource-layout-and-booklet-fields.md.
 */
const DEFAULT_PRINT_VARIANT: PrintVariant = 'line-listing';

function toFileName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'directory'}.pdf`;
}

type DialogState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | {
      status: 'generating' | 'done' | 'error';
      preview: PrintableDirectoryPreviewResponseDto;
    };

type DirectoryDownloadDialogProps = {
  locale: string;
};

export function DirectoryDownloadDialog({
  locale,
}: DirectoryDownloadDialogProps) {
  const { t } = useTranslation(['page-directories']);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appConfig = useAppConfig();

  const slug = searchParams.get(PD_SLUG_PARAM);
  const open = Boolean(slug);
  const requestedVariant = parsePrintVariantParam(
    searchParams.get(PD_VARIANT_PARAM),
  );
  const requestedFontSizeMode = parseFontSizeModeParam(
    searchParams.get(PD_FONT_SIZE_PARAM),
  );
  const requestedBookletLayout = parseBookletLayoutParam(
    searchParams.get(PD_BOOKLET_PARAM),
  );

  const [state, setState] = useState<DialogState>({ status: 'loading' });
  const startedForSlugRef = useRef<string | null>(null);

  const generate = async (preview: PrintableDirectoryPreviewResponseDto) => {
    const printVariant = requestedVariant ?? DEFAULT_PRINT_VARIANT;
    const fontSizeMode = requestedFontSizeMode ?? 'default';

    setState({ status: 'generating', preview });

    try {
      const data = printableDirectoryPreviewToPdfData(preview, locale);
      const currentDomain = withCustomBasePathAppendedToDomain(
        window.location.hostname,
      );
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      const documentElement: PdfDocumentElement = (
        <PdfFontProvider locale={locale}>
          <PDFPrintableDirectory
            data={data}
            variant={printVariant}
            fontSizeMode={fontSizeMode}
            currentDomain={currentDomain}
            currentDate={currentDate}
            brandLogoUrl={appConfig.brand.logoUrl ?? undefined}
            isBookletLayout={requestedBookletLayout}
          />
        </PdfFontProvider>
      );

      const result = await downloadPdfDocument(
        documentElement,
        toFileName(preview.name),
        {
          postProcessBlob: requestedBookletLayout
            ? applyBookletPadding
            : undefined,
        },
      );

      setState({ status: result.ok ? 'done' : 'error', preview });
    } catch (error) {
      console.error('Error generating public printable directory PDF:', error);
      setState({ status: 'error', preview });
    }
  };

  useEffect(() => {
    if (!slug || startedForSlugRef.current === slug) {
      return;
    }

    startedForSlugRef.current = slug;
    setState({ status: 'loading' });

    let cancelled = false;

    (async () => {
      const preview = await getPrintableDirectoryPublicPreview(
        slug,
        locale,
        appConfig.tenantId,
      );

      if (cancelled) {
        log.debug('Cancelled');
        return;
      }

      if (!preview) {
        setState({ status: 'not_found' });
        log.error('Preview not found');
        return;
      }

      log.debug('Preview fetched. Generating PDF...');
      await generate(preview);
      log.debug('Preview generated');
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      return;
    }

    startedForSlugRef.current = null;

    const params = new URLSearchParams(searchParams.toString());
    params.delete(PD_SLUG_PARAM);
    params.delete(PD_VARIANT_PARAM);
    params.delete(PD_FONT_SIZE_PARAM);
    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleRetry = () => {
    if (state.status === 'loading' || state.status === 'not_found') {
      return;
    }

    void generate(state.preview);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('public_preview_meta_title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4 text-center">
          {(state.status === 'loading' || state.status === 'generating') && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              {t('public_preview_generating')}
            </div>
          )}

          {state.status === 'not_found' && (
            <p className="text-muted-foreground text-sm">
              {t('public_preview_not_found')}
            </p>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3">
              <div className="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="size-4" aria-hidden="true" />
                {t('public_preview_error')}
              </div>
              <Button type="button" onClick={handleRetry} className="gap-2">
                {t('public_preview_retry')}
              </Button>
            </div>
          )}

          {state.status === 'done' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {t('public_preview_ready')}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                className="gap-2"
                data-testid="public-download-directory-btn"
              >
                {t('public_preview_retry')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
