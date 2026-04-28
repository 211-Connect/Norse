'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';

export function PrintButton({ componentToPrintRef }) {
  const { t } = useTranslation('common');
  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });

  const showPrintButton = useFlag('showPrintButton');
  if (!showPrintButton) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="flex gap-1 print:hidden"
      onClick={handlePrint}
      size="sm"
      aria-label={t('call_to_action.print')}
    >
      <Printer className="size-4" aria-hidden="true" />
      {t('call_to_action.print')}
    </Button>
  );
}
