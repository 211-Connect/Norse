'use client';

import { useTranslation } from 'react-i18next';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function LastAssuredComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');
  const showLastAssured = useFlag('showResourceLastAssuredDate');
  const appConfig = useAppConfig();

  if (!showLastAssured) {
    return null;
  }

  return (
    <Datum
      title={appConfig.resource.lastAssuredText || t('last_assured')}
      description={resource.lastAssuredOn || t('unknown')}
    />
  );
}
