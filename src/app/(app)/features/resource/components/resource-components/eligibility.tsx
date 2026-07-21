'use client';

import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function EligibilityComponent({
  resource,
  withPadding,
  iconColor,
}: {
  resource: Resource | ResultType;
  withPadding?: boolean;
  iconColor?: string;
}) {
  const { t } = useTranslation('page-resource');
  const eligibility =
    'eligibilities' in resource ? resource.eligibilities : resource.eligibility;

  if (!eligibility) {
    return null;
  }

  return (
    <Datum
      icon={BadgeCheck}
      iconColor={iconColor}
      withPadding={withPadding}
      title={t('eligibility')}
      labelAs="h3"
      description={eligibility}
    />
  );
}
