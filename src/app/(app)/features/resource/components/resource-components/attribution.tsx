'use client';

import { Resource } from '@/types/resource';
import { useTranslation } from 'react-i18next';

import { Datum } from '../datum';

export function AttributionComponent({
  resource,
}: {
  resource: Pick<Resource, 'attribution'>;
}) {
  const { t } = useTranslation('page-resource');

  return (
    <Datum
      title={t('data_providers.provided_by', { ns: 'common' })}
      description={resource.attribution || t('unknown')}
    />
  );
}
