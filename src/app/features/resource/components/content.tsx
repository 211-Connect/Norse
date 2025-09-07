'use client';

import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { useRef } from 'react';
import { fontSans } from '@/app/shared/styles/fonts';
import { cn } from '@/app/shared/lib/utils';

import { Navigation } from './navigation';
import { Overview } from './overview';
import { Information } from './information';
import { AdditionalInformation } from './additional-information';
import { OrganizationInformation } from './organization-information';

export const ResourcePageContent = ({ resource }: { resource: any }) => {
  const appConfig = useAppConfig();
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
      <Navigation
        componentToPrintRef={componentToPrintRef}
        resource={resource}
      />
      <div
        className={cn(
          'flex flex-col gap-2 font-sans lg:flex-row',
          fontSans.variable,
        )}
        ref={componentToPrintRef}
      >
        <Overview resource={resource} />

        <div className="flex flex-1 flex-col gap-2">
          <Information resource={resource} />
          <AdditionalInformation resource={resource} />
          <OrganizationInformation resource={resource} />
        </div>
      </div>
    </div>
  );
};
