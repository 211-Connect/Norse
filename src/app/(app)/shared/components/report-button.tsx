'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export function ReportButton({
  className,
  customText,
}: {
  className?: string;
  customText?: string;
}) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');

  if (!appConfig?.contact?.feedbackUrl) {
    return null;
  }

  return (
    <Button
      key="feedback"
      className={cn('flex gap-1', className)}
      variant="outline"
      onClick={(e) => {
        e.preventDefault();

        if (!appConfig?.contact?.feedbackUrl) {
          return;
        }

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
      {customText || t('report')}
    </Button>
  );
}
