import { Button } from '@/shared/components/ui/button';
import { useFlag } from '@/shared/hooks/use-flag';
import { Printer } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useReactToPrint } from 'react-to-print';

export function PrintButton({ componentToPrintRef }) {
  const { t } = useTranslation('common');
  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  // const showPrintButton = useFlag('showPrintButton');
  // if (!showPrintButton) {
  //   return null;
  // }

  return (
    <Button
      variant="outline"
      className="flex gap-1 print:hidden"
      onClick={handlePrint}
      size="sm"
    >
      <Printer className="size-4" />
      {t('call_to_action.print')}
    </Button>
  );
}
