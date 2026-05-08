'use client';

import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function FeesComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.fees) {
    return null;
  }

  return (
    <Datum icon={DollarSign} title={t('fee')} description={resource.fees} />
  );
}
