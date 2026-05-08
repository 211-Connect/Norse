'use client';

import { Badges } from '@/app/(app)/shared/components/badges';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { Resource } from '@/types/resource';
import { getBadgesForResource } from '@/utils/getBadgesForResource';
import { useMemo } from 'react';

export function BadgesComponent({
  resource,
}: {
  resource: Pick<Resource, 'facets' | 'categories'>;
}) {
  const appConfig = useAppConfig();
  const badgeConfigs = appConfig.badges;

  const labels = useMemo(() => {
    if (!resource || !badgeConfigs || badgeConfigs.length === 0) {
      return [];
    }

    return getBadgesForResource(
      badgeConfigs,
      resource.facets,
      resource.categories,
    );
  }, [resource, badgeConfigs]);

  if (labels.length === 0) {
    return null;
  }

  return <Badges items={labels} />;
}
