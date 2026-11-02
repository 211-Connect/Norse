'use client';

import { useTranslation } from 'react-i18next';

import { Resource } from '@/types/resource';

import { Datum } from '../datum';

export function OrganizationComponent({
  resource,
  showAlternateName = true,
  showDescription = true,
}: {
  resource: Resource;
  showAlternateName?: boolean;
  showDescription?: boolean;
}) {
  const { t } = useTranslation('page-resource');
  const organizationName = resource.organizationName;
  const organizationAlternateName = showAlternateName
    ? resource.organizationAlternateName
    : null;
  const organizationDescription = showDescription
    ? resource.organizationDescription
    : null;

  if (!organizationName && !organizationDescription) {
    return null;
  }

  return (
    <div>
      {organizationName && (
        <Datum
          description={organizationName}
          subdescription={organizationAlternateName}
          title={t('providing_organization')}
          labelAs="h3"
        />
      )}
      {organizationDescription && (
        <Datum description={organizationDescription} />
      )}
    </div>
  );
}
