'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { Separator } from '@/app/shared/components/ui/separator';
import { Badges } from '@/app/shared/components/badges';

import { ContactSection } from './overview-components/contact-section';
import { DetailsSection } from './overview-components/details-section';
import { MainSection } from './overview-components/main-section';
import { useFlag } from '@/app/shared/hooks/use-flag';

export function Overview({ resource }) {
  const showServiceName = useFlag('showSearchAndResourceServiceName');

  return (
    <>
      <div className="flex-1">
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <Badges className="mb-3" items={[]} /> {/* TODO: Add Waiver */}
            <CardTitle>{resource.name}</CardTitle>
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
      </div>
      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
