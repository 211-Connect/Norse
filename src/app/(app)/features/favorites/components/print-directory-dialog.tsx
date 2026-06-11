'use client';

import { pdf } from '@react-pdf/renderer';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type PrintableDirectoryData } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';
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
import { cn } from '@/app/(app)/shared/lib/utils';

import { PDFDirectory } from './pdf-directory';

type PrintDirectoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PrintableDirectoryData;
  onRestoreFocus?: () => void;
};

export function PrintDirectoryDialog({
  open,
  onOpenChange,
  data,
  onRestoreFocus,
}: PrintDirectoryDialogProps) {
  const { t } = useTranslation('page-list');
  const appConfig = useAppConfig();
  const [selectedVariant, setSelectedVariant] = useState<
    'line-listing' | 'summary-listing' | 'full-listing'
  >('line-listing');
  const [fontSizeMode, setFontSizeMode] = useState<'default' | 'large'>(
    'default',
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPDF = async () => {
    setIsGenerating(true);

    try {
      // Get current domain and date
      const currentDomain = window.location.hostname;
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      // Generate PDF in browser
      const blob = await pdf(
        <PDFDirectory
          data={data}
          variant={selectedVariant}
          fontSizeMode={fontSizeMode}
          currentDomain={currentDomain}
          currentDate={currentDate}
          brandLogoUrl={appConfig.brand.logoUrl}
          disclaimerText={t('print_footer_disclaimer', {
            brandName: appConfig.brand.name,
          })}
        />,
      ).toBlob();

      // Open PDF in new window and trigger print dialog
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        // Wait for PDF to load before triggering print
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        });

        // Cleanup when window is closed
        const cleanup = () => window.URL.revokeObjectURL(url);
        printWindow.addEventListener('beforeunload', cleanup);

        // Fallback cleanup after 5 minutes
        setTimeout(cleanup, 5 * 60 * 1000);
      } else {
        // Popup blocked - cleanup immediately
        window.URL.revokeObjectURL(url);
        toast.error(t('print_dialog.popup_blocked'));
      }

      onOpenChange(false);
      // Restore focus after dialog closes
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent closeLabel={t('call_to_action.close', { ns: 'common' })}>
          <DialogHeader>
            <DialogTitle>{t('print_dialog.title')}</DialogTitle>
            <DialogDescription>
              {t('print_dialog.select_format')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Line Listing Option */}
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

            {/* Summary Listing Option */}
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

            {/* Full Listing Option */}
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
    </>
  );
}
