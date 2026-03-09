'use client';

import { useRef } from 'react';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { cn } from '@/app/(app)/shared/lib/utils';

import { Navigation } from './navigation';
import { Resource } from '@/types/resource';
import { LayoutRenderer } from './layout-renderer';
import { DEFAULT_RESOURCE_LAYOUT } from '../types/layout-config';

export const ResourcePageContent = ({ resource }: { resource: Resource }) => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
      <Navigation
        componentToPrintRef={componentToPrintRef}
        resource={resource}
      />

      <div ref={componentToPrintRef}>
        <LayoutRenderer
          layout={DEFAULT_RESOURCE_LAYOUT}
          resource={resource}
          className={cn(fontSans.variable)}
        />
      </div>
    </div>
  );
};
