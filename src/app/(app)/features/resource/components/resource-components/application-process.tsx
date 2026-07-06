'use client';

import { Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResultType } from '@/app/(app)/shared/store/results';
import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function ApplicationProcessComponent({
  resource,
  withPadding,
}: {
  resource: Resource | ResultType;
  withPadding?: boolean;
}) {
  const { t } = useTranslation('page-resource');

  if (!resource.applicationProcess) {
    return null;
  }

  return (
    <Datum
      icon={Edit}
      title={t('application_process')}
      labelAs="h3"
      description={resource.applicationProcess}
      withPadding={withPadding}
    />
  );
}
