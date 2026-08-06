'use client';

import { Document } from '@react-pdf/renderer';
import { Check } from 'lucide-react';
import { type ComponentProps, type ReactElement, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
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
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  PRINT_DIALOG_LANGUAGE_CONTENT_ID,
  PRINT_DIALOG_LANGUAGE_TRIGGER_ID,
} from '@/app/(app)/shared/lib/aria-constants';
import {
  cn,
  withCustomBasePathAppendedToDomain,
} from '@/app/(app)/shared/lib/utils';
import { createLogger } from '@/lib/logger';

import { LanguageSwitcherPrimitive } from '../language-switcher-primitive';
import { openPdfDocument } from './openPdfDocument';
import { PdfFontProvider } from './pdf-fonts';
import { createPrintI18nInstance } from './print-i18n';
import { type FontSizeMode, type PrintVariant } from './pdf-print-primitives';

const log = createLogger('print-directory-dialog');

export type PrintDocumentRenderContext = {
  variant: PrintVariant;
  fontSizeMode: FontSizeMode;
  currentDomain: string;
  currentDate: string;
  locale: string;
};

export type PdfDocumentElement = ReactElement<ComponentProps<typeof Document>>;

type PrintDirectoryDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadData: (locale: string) => Promise<TData>;
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
  loadData,
  onRestoreFocus,
  initialVariant = 'line-listing',
  renderDocument,
  postProcessBlob,
}: PrintDirectoryDialogProps<TData>) {
  const { t, i18n } = useTranslation('page-list');
  const appConfig = useAppConfig();
  const [selectedVariant, setSelectedVariant] =
    useState<PrintVariant>(initialVariant);
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('default');
  const [selectedLocale, setSelectedLocale] = useState(i18n.language);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPDF = async () => {
    const startedAt = performance.now();

    log.debug({ selectedLocale, selectedVariant }, 'Print requested');

    setIsGenerating(true);

    try {
      const resolvedData = await loadData(selectedLocale);

      if (!resolvedData) {
        log.warn(
          { selectedLocale, loadMs: Math.round(performance.now() - startedAt) },
          'loadData returned no data',
        );
        toast.error(t('print_dialog.load_error'));
        return;
      }

      const currentDomain = withCustomBasePathAppendedToDomain(
        window.location.hostname,
      );
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      const documentElement = renderDocument(resolvedData, {
        variant: selectedVariant,
        fontSizeMode,
        currentDomain,
        currentDate,
        locale: selectedLocale,
      });

      const printI18n = await createPrintI18nInstance(
        selectedLocale,
        appConfig.i18n.defaultLocale,
      );
      const localizedDocumentElement: PdfDocumentElement = (
        <PdfFontProvider locale={selectedLocale}>
          <I18nextProvider i18n={printI18n}>{documentElement}</I18nextProvider>
        </PdfFontProvider>
      );

      const result = await openPdfDocument(localizedDocumentElement, {
        postProcessBlob: postProcessBlob
          ? (blob) => postProcessBlob(blob, resolvedData)
          : undefined,
      });

      const totalMs = Math.round(performance.now() - startedAt);

      if (!result.ok) {
        log.warn({ reason: result.reason, totalMs }, 'openPdfDocument failed');
        toast.error(
          result.reason === 'popup_blocked'
            ? t('print_dialog.popup_blocked')
            : t('print_dialog.error'),
        );
        return;
      }

      log.debug({ totalMs }, 'Print flow completed successfully');

      onOpenChange(false);
      setTimeout(() => {
        onRestoreFocus?.();
      }, 100);
    } catch (error) {
      log.error(
        { err: error, totalMs: Math.round(performance.now() - startedAt) },
        'Error generating PDF',
      );
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
              <Typography variant="paragraph" size="sm" textColor="secondary">
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
              <Typography variant="paragraph" size="sm" textColor="secondary">
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
              <Typography variant="paragraph" size="sm" textColor="secondary">
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

        {appConfig.i18n.locales.length > 1 && (
          <div className="flex flex-col gap-3">
            <Typography variant="heading" size="sm">
              {t('print_dialog.language_title')}
            </Typography>
            <LanguageSwitcherPrimitive
              value={selectedLocale}
              onValueChange={setSelectedLocale}
              locales={appConfig.i18n.locales}
              triggerId={PRINT_DIALOG_LANGUAGE_TRIGGER_ID}
              contentId={PRINT_DIALOG_LANGUAGE_CONTENT_ID}
              align="start"
              triggerClassName="w-full"
              showIcon={false}
            />
          </div>
        )}

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
            disabled={isGenerating}
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
