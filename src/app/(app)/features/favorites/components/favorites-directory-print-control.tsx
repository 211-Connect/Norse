'use client';

import { Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type PrintableDirectoryData } from '@/app/(app)/features/favorites/utils/printable-directory-transformers';
import { Button } from '@/app/(app)/shared/components/ui/button';

import { PrintDirectoryDialog } from './print-directory-dialog';

type FavoritesDirectoryPrintControlProps = {
  data: PrintableDirectoryData;
  testId?: string;
  showLabel?: boolean;
};

export function FavoritesDirectoryPrintControl({
  data,
  testId = 'print-directory-btn',
  showLabel = false,
}: FavoritesDirectoryPrintControlProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        size={showLabel ? 'default' : 'icon'}
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid={testId}
        ref={triggerRef}
        aria-label={t('call_to_action.print')}
        className={showLabel ? 'gap-2' : undefined}
      >
        <Printer className="size-4" />
        {showLabel && <span>{t('call_to_action.print')}</span>}
      </Button>

      <PrintDirectoryDialog
        open={open}
        onOpenChange={setOpen}
        data={data}
        restoreFocusElement={triggerRef.current}
      />
    </>
  );
}
