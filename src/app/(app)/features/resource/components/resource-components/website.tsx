'use client';

import { LinkIcon } from 'lucide-react';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';

export function WebsiteComponent({ resource }: { resource: Resource }) {
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
    />
  );
}
