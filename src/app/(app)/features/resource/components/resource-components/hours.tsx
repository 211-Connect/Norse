'use client';

import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function HoursComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.hours) {
    return null;
  }

  const description = resource.hours.replaceAll(';', '\n');

  return <Datum icon={Clock} title={t('hours')} description={description} />;
}
