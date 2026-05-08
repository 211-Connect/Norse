'use client';

import { Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function ApplicationProcessComponent({
  resource,
}: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.applicationProcess) {
    return null;
  }

  return (
    <Datum
      icon={Edit}
      title={t('application_process')}
      description={resource.applicationProcess}
    />
  );
}
