'use client';

import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function OrganizationAlternateNameComponent({
  resource,
}: {
  resource: Resource;
}) {
  const { t } = useTranslation('page-resource');

  if (!resource.organizationAlternateName) {
    return null;
  }

  return (
    <Datum
      title={t('organization_alternate_name')}
      labelAs="h3"
      description={resource.organizationAlternateName}
    />
  );
}
