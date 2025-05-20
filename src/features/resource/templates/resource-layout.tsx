'use client';

import { fontSans } from '@/styles/fonts';
import { Navigation } from '../components/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/cn-utils';
import { Resource } from '@/types/resource';

type ResourceLayoutProps = {
  children: React.ReactNode;
  resource: Resource;
  prevSearch: string | undefined;
};
export function ResourceLayout({
  children,
  resource,
  prevSearch,
}: ResourceLayoutProps) {
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
      <Navigation
        componentToPrintRef={componentToPrintRef}
        resource={resource}
        prevSearch={prevSearch}
      />

      <div
        className={cn(
          'flex flex-col gap-2 font-sans lg:flex-row',
          fontSans.variable,
        )}
        ref={componentToPrintRef}
      >
        {children}
      </div>
    </div>
  );
}
