'use client';

import { LinkIcon } from 'lucide-react';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';
import { ResourceComponentProps } from '../component-registry';

export function WebsiteComponent({ resource }: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.website) {
    return null;
  }

  return (
    <Datum
      icon={LinkIcon}
      url={resource.website}
      urlTarget="_blank"
      title={t('website')}
      description={resource.website}
      shouldParseHtml={false}
    />
  );
}
