'use client';

import { LinkIcon } from 'lucide-react';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';
import { ResourceComponentProps } from '../component-registry';

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
      description={resource.organizationUrl}
      shouldParseHtml={false}
    />
  );
}
