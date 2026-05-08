'use client';

import { cn } from '@/app/(app)/shared/lib/utils';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { AppConfig } from '@/types/appConfig';
import { Resource } from '@/types/resource';
import { useRef } from 'react';

import { LayoutRenderer } from './layout-renderer';
import { Navigation } from './navigation';

type ResourcePageContentProps = {
  resource: Resource;
  layout: AppConfig['resource']['layout'];
};

export const ResourcePageContent = ({
  resource,
  layout,
}: ResourcePageContentProps) => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
      <Navigation
        componentToPrintRef={componentToPrintRef}
        resource={resource}
      />

      <div ref={componentToPrintRef}>
        <LayoutRenderer
          layout={layout}
          resource={resource}
          className={cn(fontSans.variable)}
        />
      </div>
    </div>
  );
};
