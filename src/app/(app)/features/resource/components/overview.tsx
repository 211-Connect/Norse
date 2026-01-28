'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Separator } from '@/app/(app)/shared/components/ui/separator';
import { Badges } from '@/app/(app)/shared/components/badges';

import { ContactSection } from './overview-components/contact-section';
import { DetailsSection } from './overview-components/details-section';
import { MainSection } from './overview-components/main-section';
import { FacetsSection } from './overview-components/facets-section';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { Resource } from '@/types/resource';

export function Overview({ resource }: { resource: Resource }) {
  const showServiceName = useFlag('showSearchAndResourceServiceName');

  return (
    <>
      <div className="flex flex-1 flex-col gap-3">
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <Badges className="mb-3" items={[]} /> {/* TODO: Add Waiver */}
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
