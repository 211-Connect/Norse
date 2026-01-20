'use client';

import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { ReportButton } from '@/app/(app)/shared/components/report-button';
import { PrintButton } from '@/app/(app)/shared/components/print-button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';

import { BackToResultsButton } from './back-to-results-button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { Resource } from '@/types/resource';

export function Navigation({
  componentToPrintRef,
  resource,
}: {
  componentToPrintRef: unknown;
  resource: Resource;
}) {
  const appConfig = useAppConfig();

  return (
    <div className="flex justify-between print:hidden">
      <BackToResultsButton />
      <div className="flex gap-2">
        <PrintButton componentToPrintRef={componentToPrintRef} />
        <ShareButton
          componentToPrintRef={componentToPrintRef}
          title={resource.name ?? undefined}
          body={resource.description ?? undefined}
        />
        <AddToFavoritesButton serviceAtLocationId={resource.id} />
        {appConfig.featureFlags.showFeedbackButtonOnResourcePages ? (
          <ReportButton />
        ) : null}
      </div>
    </div>
  );
}
