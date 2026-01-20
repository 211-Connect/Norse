'use client';

import { useRef } from 'react';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { cn } from '@/app/(app)/shared/lib/utils';

import { Navigation } from './navigation';
import { Overview } from './overview';
import { OrganizationInformation } from './organization-information';
import { DescriptionSection } from './description-section';
import { MapSection } from './map-section';
import { Resource } from '@/types/resource';

export const ResourcePageContent = ({ resource }: { resource: Resource }) => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
      <Navigation
        componentToPrintRef={componentToPrintRef}
        resource={resource}
      />

      <div
        className={cn(
          'grid grid-cols-1 gap-3 font-sans md:grid-cols-2',
          fontSans.variable,
        )}
        ref={componentToPrintRef}
      >
        <Overview resource={resource} />

        <div className="flex flex-1 flex-col gap-3">
          <DescriptionSection resource={resource} />
          <MapSection resource={resource} />
          <OrganizationInformation resource={resource} />
        </div>
      </div>
    </div>
  );
};
