'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function EligibilityComponent({
  resource,
  withPadding,
}: {
  resource: Resource | ResultType;
  withPadding?: boolean;
}) {
  const { t } = useTranslation('page-resource');
  const eligibility =
    'eligibilities' in resource ? resource.eligibilities : resource.eligibility;

  if (!eligibility) {
    return null;
  }

  return (
    <Datum
      icon={TriangleAlert}
      iconColor="text-destructive"
      withPadding={withPadding}
      title={t('eligibility')}
      description={eligibility}
    />
  );
}
