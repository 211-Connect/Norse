'use client';

import { pdf } from '@react-pdf/renderer';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PDFDirectory } from '@/app/(app)/features/favorites/components/pdf-directory';
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
    'phone-book' | 'all-info'
  >('phone-book');
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
            {/* Phone Book Option */}
            <button
              type="button"
              onClick={() => setSelectedVariant('phone-book')}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                selectedVariant === 'phone-book'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  selectedVariant === 'phone-book'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground',
                )}
              >
                {selectedVariant === 'phone-book' && (
                  <Check className="text-primary-foreground size-3" />
                )}
              </div>
              <div className="flex-1">
                <Typography variant="heading" size="sm" className="mb-1">
                  {t('print_dialog.phone_book')}
                </Typography>
                <Typography variant="paragraph" size="sm" textColor="secondary">
                  {t('print_dialog.phone_book_desc')}
                </Typography>
              </div>
            </button>

            {/* All Info Option */}
            <button
              type="button"
              onClick={() => setSelectedVariant('all-info')}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
                selectedVariant === 'all-info'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2',
                  selectedVariant === 'all-info'
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground',
                )}
              >
                {selectedVariant === 'all-info' && (
                  <Check className="text-primary-foreground size-3" />
                )}
              </div>
              <div className="flex-1">
                <Typography variant="heading" size="sm" className="mb-1">
                  {t('print_dialog.all_info')}
                </Typography>
                <Typography variant="paragraph" size="sm" textColor="secondary">
                  {t('print_dialog.all_info_desc')}
                </Typography>
              </div>
            </button>
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
