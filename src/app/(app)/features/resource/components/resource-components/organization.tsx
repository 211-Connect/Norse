'use client';

import { useTranslation } from 'react-i18next';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function OrganizationComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');
  const organizationName = resource.organizationName;
  const organizationDescription = resource.organizationDescription;

  if (!organizationName && !organizationDescription) {
    return null;
  }

  return (
    <div>
      {organizationName && (
        <Datum
          description={organizationName}
          title={t('providing_organization')}
        />
      )}
      {organizationDescription && (
        <Datum description={organizationDescription} />
      )}
    </div>
  );
}
