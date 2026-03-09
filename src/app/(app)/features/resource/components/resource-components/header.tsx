'use client';

import { useMemo } from 'react';
import { CardHeader } from '@/app/(app)/shared/components/ui/card';
import { Badges } from '@/app/(app)/shared/components/badges';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getBadgesForResource } from '@/utils/getBadgesForResource';
import { Resource } from '@/types/resource';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function HeaderComponent({ resource }: { resource: Resource }) {
  const showServiceName = useFlag('showSearchAndResourceServiceName');
  const appConfig = useAppConfig();
  const badgeConfigs = appConfig.badges;

  const labels = useMemo(() => {
    if (!resource || !badgeConfigs || badgeConfigs.length === 0) {
      return [];
    }
    return getBadgesForResource(resource.facets, badgeConfigs);
  }, [resource, badgeConfigs]);

  return (
    <CardHeader className="gap-2">
      {labels.length > 0 && <Badges items={labels} />}
      <Typography variant="heading" size="md" as="h1">
        {resource.name}
      </Typography>
      {showServiceName && resource.serviceName && (
        <Typography variant="heading" size="sm" textColor="secondary">
          {resource.serviceName}
        </Typography>
      )}
    </CardHeader>
  );
}
