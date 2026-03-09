'use client';

import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function EligibilityComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.eligibilities) {
    return null;
  }

  return (
    <Datum
      icon={TriangleAlert}
      iconColor="text-destructive"
      title={t('eligibility')}
      description={resource.eligibilities}
    />
  );
}
