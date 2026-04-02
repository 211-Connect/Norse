'use client';

import { SearchCardComponentProps } from './types';
import { BadgesComponent as ResourceBadgesComponent } from '../../../resource/components/resource-components';
import { Pin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/app/(app)/shared/components/ui/badge';

const PriorityBadge = ({ result }: SearchCardComponentProps) => {
  const { t } = useTranslation('common');

  if (result.priority !== 1) {
    return null;
  }

  return (
    <Badge variant="outline" className="flex gap-1">
      {t('pinned', { ns: 'page-search' })}
      <Pin className="size-4" />
    </Badge>
  );
};

export function BadgesComponent({ result }: SearchCardComponentProps) {
  const resource = {
    facets: result?.facets,
    categories: result?.taxonomies,
  };

  return (
    <div className="flex flex-row justify-between gap-2">
      <ResourceBadgesComponent resource={resource} />
      <PriorityBadge result={result} />
    </div>
  );
}
