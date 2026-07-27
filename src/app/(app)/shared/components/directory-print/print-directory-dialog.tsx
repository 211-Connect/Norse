'use client';

import { Document } from '@react-pdf/renderer';
import { Check, LoaderCircle } from 'lucide-react';
import { type ComponentProps, type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { cn } from '@/app/(app)/shared/lib/utils';

import { openPdfDocument } from './openPdfDocument';
import { type FontSizeMode, type PrintVariant } from './pdf-print-primitives';

export type PrintDocumentRenderContext = {
  variant: PrintVariant;
  fontSizeMode: FontSizeMode;
  currentDomain: string;
  currentDate: string;
};

export type PdfDocumentElement = ReactElement<ComponentProps<typeof Document>>;

type PrintDirectoryDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TData | null;
  isLoadingData?: boolean;
  hasLoadError?: boolean;
  onRetryLoad?: () => void;
  onRestoreFocus?: () => void;
  initialVariant?: PrintVariant;
  renderDocument: (
    data: TData,
    context: PrintDocumentRenderContext,
  ) => PdfDocumentElement;
  postProcessBlob?: (blob: Blob, data: TData) => Promise<Blob>;
};

export function PrintDirectoryDialog<TData>({
  open,
  onOpenChange,
  data,
  isLoadingData = false,
  hasLoadError = false,
  onRetryLoad,
  onRestoreFocus,
  initialVariant = 'line-listing',
  renderDocument,
  postProcessBlob,
}: PrintDirectoryDialogProps<TData>) {
  const { t } = useTranslation('page-list');
  const [selectedVariant, setSelectedVariant] =
    useState<PrintVariant>(initialVariant);
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('default');
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPDF = async () => {
    if (!data) {
      return;
    }

    setIsGenerating(true);

    try {
      const currentDomain = window.location.hostname;
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      const documentElement = renderDocument(data, {
        variant: selectedVariant,
        fontSizeMode,
        currentDomain,
        currentDate,
      });

      const result = await openPdfDocument(documentElement, {
        postProcessBlob: postProcessBlob
          ? (blob) => postProcessBlob(blob, data)
          : undefined,
      });

      if (!result.ok) {
        toast.error(
          result.reason === 'popup_blocked'
            ? t('print_dialog.popup_blocked')
            : t('print_dialog.error'),
        );
        return;
      }

      onOpenChange(false);
      setTimeout(() => {
        onRestoreFocus?.();
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('print_dialog.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('call_to_action.close', { ns: 'common' })}>
        <DialogHeader>
          <DialogTitle>{t('print_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('print_dialog.select_format')}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-36 text-sm">
            <LoaderCircle className="size-12 animate-spin" />
            {t('print_dialog.loading_resources')}
          </div>
        ) : hasLoadError ? (
          <div className="flex flex-col gap-3 py-3">
            <Typography variant="paragraph" size="sm" textColor="secondary">
              {t('print_dialog.load_error')}
            </Typography>
            {onRetryLoad && (
              <div>
                <Button variant="outline" type="button" onClick={onRetryLoad}>
                  {t('print_dialog.retry')}
                </Button>
              </div>
            )}
          </div>
        ) : data ? (
          <>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setSelectedVariant('line-listing')}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  selectedVariant === 'line-listing'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    selectedVariant === 'line-listing'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground',
                  )}
                >
                  {selectedVariant === 'line-listing' && (
                    <Check className="text-primary-foreground size-3" />
                  )}
                </div>
                <div className="flex-1">
                  <Typography variant="heading" size="sm" className="mb-1">
                    {t('print_dialog.line_listing')}
                  </Typography>
                  <Typography
                    variant="paragraph"
                    size="sm"
                    textColor="secondary"
                  >
                    {t('print_dialog.line_listing_desc')}
                  </Typography>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('summary-listing')}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  selectedVariant === 'summary-listing'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    selectedVariant === 'summary-listing'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground',
                  )}
                >
                  {selectedVariant === 'summary-listing' && (
                    <Check className="text-primary-foreground size-3" />
                  )}
                </div>
                <div className="flex-1">
                  <Typography variant="heading" size="sm" className="mb-1">
                    {t('print_dialog.summary_listing')}
                  </Typography>
                  <Typography
                    variant="paragraph"
                    size="sm"
                    textColor="secondary"
                  >
                    {t('print_dialog.summary_listing_desc')}
                  </Typography>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('full-listing')}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                  selectedVariant === 'full-listing'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                    selectedVariant === 'full-listing'
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground',
                  )}
                >
                  {selectedVariant === 'full-listing' && (
                    <Check className="text-primary-foreground size-3" />
                  )}
                </div>
                <div className="flex-1">
                  <Typography variant="heading" size="sm" className="mb-1">
                    {t('print_dialog.full_listing')}
                  </Typography>
                  <Typography
                    variant="paragraph"
                    size="sm"
                    textColor="secondary"
                  >
                    {t('print_dialog.full_listing_desc')}
                  </Typography>
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Typography variant="heading" size="sm">
                {t('print_dialog.font_size_title')}
              </Typography>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFontSizeMode('default')}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors',
                    fontSizeMode === 'default'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                      fontSizeMode === 'default'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground',
                    )}
                  >
                    {fontSizeMode === 'default' && (
                      <Check className="text-primary-foreground size-2.5" />
                    )}
                  </div>
                  {t('print_dialog.font_size_standard')}
                </button>

                <button
                  type="button"
                  onClick={() => setFontSizeMode('large')}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors',
                    fontSizeMode === 'large'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                      fontSizeMode === 'large'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground',
                    )}
                  >
                    {fontSizeMode === 'large' && (
                      <Check className="text-primary-foreground size-2.5" />
                    )}
                  </div>
                  {t('print_dialog.font_size_large')}
                </button>
              </div>
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
            disabled={isGenerating}
          >
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={handlePrintPDF}
            type="button"
            disabled={isGenerating || isLoadingData || !data}
          >
            {isGenerating
              ? t('print_dialog.generating')
              : t('print_dialog.print_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
