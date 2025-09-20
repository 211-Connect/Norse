import { useTranslation } from 'next-i18next';
import { TriangleAlert } from 'lucide-react';

import { useAppConfig } from '../hooks/use-app-config';
import { Button } from './ui/button';

export function ReportButton({}) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');

  if (!appConfig?.contact?.feedbackUrl) {
    return null;
  }

  return (
    <Button
      key="feedback"
      className="flex gap-1"
      variant="outline"
      onClick={(e) => {
        e.preventDefault();

        const currentUrl = new URL(appConfig?.contact?.feedbackUrl);
        const feedbackUrl = currentUrl.toString().split('?')[0];
        const urlParams = new URLSearchParams(currentUrl.searchParams);

        if (typeof window !== 'undefined') {
          urlParams.set('referring_url', window.location.href);
        }

        window.open(`${feedbackUrl}?${urlParams.toString()}`, '_blank');
      }}
    >
      <TriangleAlert className="size-4" />
      {t('report')}
    </Button>
  );
}
