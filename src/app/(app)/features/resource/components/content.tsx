'use client';

import { useCallback } from 'react';

import { ResourceEntry } from '@/app/(app)/shared/lib/umami';
import { cn } from '@/app/(app)/shared/lib/utils';
import { getResource } from '@/app/(app)/shared/services/resource-service';
import { fontSans } from '@/app/(app)/shared/styles/fonts';
import { resourcesToPrintableDirectory } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { AppConfig } from '@/types/appConfig';
import { Resource } from '@/types/resource';

import { useResourceViewTracking } from '../hooks/use-resource-view-tracking';
import { LayoutRenderer } from './layout-renderer';
import { Navigation } from './navigation';

type ResourcePageContentProps = {
  resource: Resource;
  layout: AppConfig['resource']['layout'];
  entry: ResourceEntry;
  resourceId: string;
  tenantId: string;
  locale: string;
};

export const ResourcePageContent = ({
  resource,
  layout,
  entry,
  resourceId,
  tenantId,
}: ResourcePageContentProps) => {
  const loadPrintableDirectoryData = useCallback(
    async (printLocale: string) => {
      const freshResource = await getResource(
        resource.id,
        printLocale,
        tenantId,
      );
      const target = freshResource ?? resource;

      return resourcesToPrintableDirectory(
        [target],
        printLocale,
        target.name?.trim() || target.serviceName?.trim() || '',
      );
    },
    [resource, tenantId],
  );

  useResourceViewTracking({ entry, resourceId, tenantId });

  const pageHeadingText =
    resource.name?.trim() || resource.serviceName?.trim() || 'Resource details';

  return (
    <div className="container mx-auto flex flex-col gap-2 pt-2 pb-2">
      <h1 className="sr-only">{pageHeadingText}</h1>
      <Navigation
        resource={resource}
        loadPrintableDirectoryData={loadPrintableDirectoryData}
      />

      <div>
        <LayoutRenderer
          layout={layout}
          resource={resource}
          className={cn(fontSans.variable)}
        />
      </div>
    </div>
  );
};
