'use client';

import { useTranslation } from 'react-i18next';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function AttributionComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');
  const showAttribution = useFlag('showResourceAttribution');

  if (!showAttribution || resource.attribution == null) {
    return null;
  }

  return (
    <Datum
      title={t('data_providers.provided_by', { ns: 'common' })}
      description={resource.attribution || t('unknown')}
    />
  );
}
