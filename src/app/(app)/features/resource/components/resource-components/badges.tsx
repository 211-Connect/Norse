'use client';

import { useMemo } from 'react';
import { Badges } from '@/app/(app)/shared/components/badges';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getBadgesForResource } from '@/utils/getBadgesForResource';
import { ResourceComponentProps } from '../component-registry';

export function BadgesComponent({ resource }: ResourceComponentProps) {
  const appConfig = useAppConfig();
  const badgeConfigs = appConfig.badges;

  const labels = useMemo(() => {
    if (!resource || !badgeConfigs || badgeConfigs.length === 0) {
      return [];
    }
    return getBadgesForResource(resource.facets, badgeConfigs);
  }, [resource, badgeConfigs]);

  if (labels.length === 0) {
    return null;
  }

  return <Badges items={labels} />;
}
