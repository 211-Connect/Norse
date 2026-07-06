'use client';

import { LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function OrganizationUrlComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.organizationUrl) {
    return null;
  }

  if (resource.organizationUrl === resource.website) {
    return null;
  }

  return (
    <Datum
      icon={LinkIcon}
      url={resource.organizationUrl}
      urlTarget="_blank"
      title={t('organization_url')}
      labelAs="h3"
      description={resource.organizationUrl}
      shouldParseHtml={false}
    />
  );
}
