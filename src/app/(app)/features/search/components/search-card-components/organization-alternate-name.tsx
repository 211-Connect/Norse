'use client';

import { useTranslation } from 'react-i18next';

import { Datum } from '../../../resource/components/datum';
import { SearchCardComponentProps } from './types';

export function OrganizationAlternateNameComponent({
  result,
}: SearchCardComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!result.organizationAlternateName) {
    return null;
  }

  return (
    <Datum
      title={t('organization_alternate_name')}
      labelAs="h3"
      description={result.organizationAlternateName}
    />
  );
}
