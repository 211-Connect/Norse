'use client';

import { Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { type PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';

import { PrintDirectoryDialog } from './print-directory-dialog';

type DirectoryPrintControlProps = {
  data: PrintableDirectoryData | null;
  loadData?: () => Promise<PrintableDirectoryData>;
  testId?: string;
};

export function DirectoryPrintControl({
  data,
  loadData,
  testId = 'print-directory-btn',
}: DirectoryPrintControlProps) {
  const { t } = useTranslation(['common', 'page-list']);
  const [open, setOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadedData, setLoadedData] = useState<PrintableDirectoryData | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);

  const resolvedData = data ?? loadedData;

  const handleOpen = async () => {
    setOpen(true);
    setLoadError(false);

    if (resolvedData || !loadData || isLoadingData) {
      return;
    }

    setIsLoadingData(true);
    try {
      const nextData = await loadData();
      setLoadedData(nextData);
    } catch (error) {
      console.error('Error loading printable directory data:', error);
      setLoadError(true);
      toast.error(t('print_dialog.load_error', { ns: 'page-list' }));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRetry = async () => {
    if (!loadData || isLoadingData) return;
    setLoadError(false);
    setIsLoadingData(true);
    try {
      const nextData = await loadData();
      setLoadedData(nextData);
    } catch (error) {
      console.error('Error loading printable directory data:', error);
      setLoadError(true);
      toast.error(t('print_dialog.load_error', { ns: 'page-list' }));
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <>
      <Button
        size="default"
        variant="outline"
        onClick={handleOpen}
        data-testid={testId}
        ref={triggerRef}
        aria-label={t('call_to_action.print')}
        className={'gap-2'}
      >
        <Printer className="size-4" />
        <span>{t('call_to_action.print')}</span>
      </Button>

      <PrintDirectoryDialog
        open={open}
        onOpenChange={setOpen}
        data={resolvedData}
        isLoadingData={isLoadingData}
        hasLoadError={loadError}
        onRetryLoad={handleRetry}
        onRestoreFocus={() => triggerRef.current?.focus()}
      />
    </>
  );
}
