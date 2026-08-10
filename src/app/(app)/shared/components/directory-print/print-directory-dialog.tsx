'use client';

import { Document } from '@react-pdf/renderer';
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
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { withCustomBasePathAppendedToDomain } from '@/app/(app)/shared/lib/utils';
import { createLogger } from '@/lib/logger';

import { openPdfDocument } from './openPdfDocument';
import { PdfFontProvider } from './pdf-fonts';
import { PrintFormatOptions } from './print-format-options';
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
  availableLocales?: string[];
  initialLocale?: string;
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
  availableLocales,
  initialLocale,
  renderDocument,
  postProcessBlob,
}: PrintDirectoryDialogProps<TData>) {
  const { t, i18n } = useTranslation('page-list');
  const appConfig = useAppConfig();
  const locales = availableLocales ?? appConfig.i18n.locales;
  const [selectedVariant, setSelectedVariant] =
    useState<PrintVariant>(initialVariant);
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>('default');
  const [selectedLocale, setSelectedLocale] = useState(
    initialLocale ?? i18n.language,
  );
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

        <PrintFormatOptions
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
          fontSizeMode={fontSizeMode}
          onFontSizeModeChange={setFontSizeMode}
          selectedLocale={selectedLocale}
          onSelectedLocaleChange={setSelectedLocale}
          availableLocales={locales}
        />

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
