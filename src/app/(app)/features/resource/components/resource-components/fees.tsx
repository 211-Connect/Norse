'use client';

import { useTranslation } from 'react-i18next';
import { DollarSign } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

export function FeesComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.fees) {
    return null;
  }

  return (
    <Datum icon={DollarSign} title={t('fee')} description={resource.fees} />
  );
}
