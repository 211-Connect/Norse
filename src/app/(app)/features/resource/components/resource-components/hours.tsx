'use client';

import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function HoursComponent({
  resource,
  withPadding,
  iconColor,
  withTitle = true,
}: {
  resource: Resource | ResultType;
  withPadding?: boolean;
  iconColor?: string;
  withTitle?: boolean;
}) {
  const { t } = useTranslation('page-resource');

  if (!resource.hours) {
    return null;
  }

  const hours = resource.hours.replaceAll(';', '\n');
  const hoursDetails =
    'hoursDescription' in resource ? resource.hoursDescription : undefined;

  return (
    <Datum
      icon={Clock}
      iconColor={iconColor}
      withPadding={withPadding}
      title={withTitle ? t('hours') : undefined}
      labelAs="h3"
      description={hours}
      subdescription={hoursDetails}
    />
  );
}
