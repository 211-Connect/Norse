'use client';

import {
  Alert as AlertContainer,
  AlertDescription,
} from '@/app/(app)/shared/components/ui/alert';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { parseHtml } from '@/app/(app)/shared/lib/parse-html';
import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AlertComponent({
  resource,
}: {
  resource: Resource | ResultType;
}) {
  const { t } = useTranslation('common');

  if (!resource.alert) {
    return null;
  }

  return (
    <AlertContainer className="py-2" variant="destructive">
      <AlertDescription className="flex flex-row items-center gap-4">
        <AlertCircle className="size-6 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <Typography variant="label" size="sm" className="text-destructive">
            {parseHtml(resource.alert)}
          </Typography>
          {resource.alertDate && (
            <Typography variant="label" size="sm" className="text-destructive">
              <strong>{t('alert_date')}:</strong>
              {` ${resource.alertDate}`}
            </Typography>
          )}
        </div>
      </AlertDescription>
    </AlertContainer>
  );
}
