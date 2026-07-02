'use client';

import { useTranslation } from 'react-i18next';

import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { Resource } from '@/types/resource';

export function ResourceNameComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.name) {
    return null;
  }

  return (
    <Typography variant="heading" size="md" as="h2">
      <span className="sr-only">{t('resource_name')}:</span>
      {resource.name}
    </Typography>
  );
}
