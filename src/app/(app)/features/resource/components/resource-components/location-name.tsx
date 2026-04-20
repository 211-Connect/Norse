'use client';

import { useTranslation } from 'react-i18next';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';
import { ResultType } from '@/app/(app)/shared/store/results';

export function LocationNameComponent({
  resource,
}: {
  resource: Resource | ResultType;
}) {
  const { t } = useTranslation('page-resource');

  if (!resource.locationName) {
    return null;
  }

  return (
    <Datum title={t('location_name')} description={resource.locationName} />
  );
}
