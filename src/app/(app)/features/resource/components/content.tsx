'use client';

import { useRef } from 'react';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { cn } from '@/app/(app)/shared/lib/utils';

import { Navigation } from './navigation';
import { Resource } from '@/types/resource';
import { LayoutRenderer } from './layout-renderer';
import { AppConfig } from '@/types/appConfig';

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
