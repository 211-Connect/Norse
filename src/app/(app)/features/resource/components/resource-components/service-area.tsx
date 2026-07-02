'use client';

import { Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function ServiceAreaComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const serviceArea =
    resource.serviceAreaName || resource.serviceAreaDescription;
  const serviceAreaDetails =
    resource.serviceAreaName && resource.serviceAreaDescription
      ? resource.serviceAreaDescription
      : null;

  if (!serviceArea && !serviceAreaDetails) {
    return null;
  }

  return (
    <Datum
      icon={Map}
      title={t('service_area')}
      labelAs="h3"
      description={serviceArea}
      subdescription={serviceAreaDetails}
    />
  );
}
