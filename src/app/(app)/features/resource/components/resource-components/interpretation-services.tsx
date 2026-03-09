'use client';

import { useTranslation } from 'react-i18next';
import { Handshake } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

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
      description={resource.interpretationServices}
    />
  );
}
