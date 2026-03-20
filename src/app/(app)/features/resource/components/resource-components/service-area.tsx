'use client';

import { useTranslation } from 'react-i18next';
import { Map } from 'lucide-react';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function ServiceAreaComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const serviceArea =
    resource.serviceAreaName || resource.serviceAreaDescription;

  if (!serviceArea) {
    return null;
  }

  return (
    <Datum icon={Map} title={t('service_area')} description={serviceArea} />
  );
}
