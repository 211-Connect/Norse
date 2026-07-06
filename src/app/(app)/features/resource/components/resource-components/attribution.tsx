'use client';

import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

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
      labelAs="h3"
      description={resource.attribution || t('unknown')}
    />
  );
}
