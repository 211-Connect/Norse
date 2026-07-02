'use client';

import { Handshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function InterpretationServicesComponent({
  resource,
}: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.interpretationServices) {
    return null;
  }

  return (
    <Datum
      icon={Handshake}
      title={t('interpretation_services')}
      labelAs="h3"
      description={resource.interpretationServices}
    />
  );
}
