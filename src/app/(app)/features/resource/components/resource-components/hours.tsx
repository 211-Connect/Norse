'use client';

import { Resource } from '@/types/resource';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Datum } from '../datum';

export function HoursComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.hours) {
    return null;
  }

  const hours = resource.hours.replaceAll(';', '\n');
  const hoursDetails = resource.hoursDescription;

  return (
    <Datum
      icon={Clock}
      title={t('hours')}
      description={hours}
      subdescription={hoursDetails}
    />
  );
}
