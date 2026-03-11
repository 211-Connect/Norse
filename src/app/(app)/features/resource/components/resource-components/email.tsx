'use client';

import { Send } from 'lucide-react';
import { Link } from '@/app/(app)/shared/components/link';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';
import { useTranslation } from 'react-i18next';

export function EmailComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.email) {
    return null;
  }

  return (
    <Datum
      icon={Send}
      title={t('email')}
      description={resource.email}
      url={`mailto:${resource.email}`}
      shouldParseHtml={false}
    />
  );
}
