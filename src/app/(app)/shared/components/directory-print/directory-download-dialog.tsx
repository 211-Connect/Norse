'use client';

import { AlertCircle, LoaderCircle } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { applyBookletPadding } from '@/app/(app)/shared/components/directory-print/applyBookletPadding';
import { downloadPdfDocument } from '@/app/(app)/shared/components/directory-print/openPdfDocument';
import { PDFPrintableDirectory } from '@/app/(app)/shared/components/directory-print/pdf-printable-directory';
import { type PrintVariant } from '@/app/(app)/shared/components/directory-print/pdf-print-primitives';
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

const QUERY_PARAM = 'directory';

const RESOURCE_LAYOUT_TO_PRINT_VARIANT: Partial<
  Record<PrintableDirectoryPreviewResponseDto['resourceLayout'], PrintVariant>
> = {
  line: 'line-listing',
  summary: 'summary-listing',
  full: 'full-listing',
};

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
      status: 'unsupported' | 'generating' | 'done' | 'error';
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

  const slug = searchParams.get(QUERY_PARAM);
  const open = Boolean(slug);

  const [state, setState] = useState<DialogState>({ status: 'loading' });
  const startedForSlugRef = useRef<string | null>(null);

  const generate = async (preview: PrintableDirectoryPreviewResponseDto) => {
    const printVariant =
      RESOURCE_LAYOUT_TO_PRINT_VARIANT[preview.resourceLayout];

    if (!printVariant) {
      setState({ status: 'unsupported', preview });
      return;
    }

    setState({ status: 'generating', preview });

    try {
      const data = printableDirectoryPreviewToPdfData(preview, locale);
      const currentDomain = window.location.hostname;
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      const documentElement = (
        <PDFPrintableDirectory
          data={data}
          variant={printVariant}
          fontSizeMode="default"
          currentDomain={currentDomain}
          currentDate={currentDate}
          brandLogoUrl={appConfig.brand.logoUrl ?? undefined}
        />
      );

      const result = await downloadPdfDocument(
        documentElement,
        toFileName(preview.name),
        {
          postProcessBlob: data.isBookletLayout
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
        return;
      }

      if (!preview) {
        setState({ status: 'not_found' });
        return;
      }

      await generate(preview);
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
    params.delete(QUERY_PARAM);
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

          {state.status === 'unsupported' && (
            <p className="text-muted-foreground text-sm">
              {t('public_preview_unavailable')}
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
