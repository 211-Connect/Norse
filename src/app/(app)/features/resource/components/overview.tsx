'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { Badges } from '@/app/(app)/shared/components/badges';

import { ContactSection } from './overview-components/contact-section';
import { DetailsSection } from './overview-components/details-section';
import { MainSection } from './overview-components/main-section';
import { FacetsSection } from './overview-components/facets-section';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { Resource } from '@/types/resource';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { getBadgesForResource } from '@/utils/getBadgesForResource';

export function Overview({ resource }: { resource: Resource }) {
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
    <>
      <div className="flex flex-1 flex-col gap-3">
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            {labels.length > 0 && <Badges className="mb-3" items={labels} />}
            <h1 className="mb-3 text-xl font-semibold leading-none tracking-tight">
              {resource.name}
            </h1>
            {showServiceName && (
              <CardDescription className="mb-3">
                {resource.serviceName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <MainSection resource={resource} />
            <ContactSection resource={resource} />
            <DetailsSection resource={resource} />
          </CardContent>
        </Card>
        <FacetsSection resource={resource} />
      </div>
      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
