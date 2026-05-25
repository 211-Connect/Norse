'use client';

import { Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';

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
import { cn } from '@/app/(app)/shared/lib/utils';

import { PrintableDirectory } from './printable-directory';

type PrintDirectoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PrintableDirectoryData;
  restoreFocusElement?: HTMLElement | null;
};

export function PrintDirectoryDialog({
  open,
  onOpenChange,
  data,
  restoreFocusElement,
}: PrintDirectoryDialogProps) {
  const { t } = useTranslation('page-list');
  const [selectedVariant, setSelectedVariant] = useState<
    'phone-book' | 'all-info'
  >('phone-book');
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });

  const handlePrintClick = () => {
    handlePrint();
    onOpenChange(false);
    // Restore focus after dialog unmounts and print dialog closes
    // The browser's print dialog can interfere with normal focus restoration
    setTimeout(() => {
      restoreFocusElement?.focus();
    }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          restoreFocusElement={restoreFocusElement}
          closeLabel={t('call_to_action.close', { ns: 'common' })}
        >
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
                'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
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
                'flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors',
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
            >
              {t('call_to_action.cancel', { ns: 'common' })}
            </Button>
            <Button onClick={handlePrintClick} type="button">
              {t('print_dialog.print_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden printable content */}
      <div className="hidden">
        <PrintableDirectory
          ref={componentToPrintRef}
          data={data}
          variant={selectedVariant}
        />
      </div>
    </>
  );
}
