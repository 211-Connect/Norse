'use client';

import { useTranslation } from 'react-i18next';
import { Edit } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

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
