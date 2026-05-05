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
  componentToPrintRef: React.RefObject<HTMLElement | null>;
  resource: Resource;
}) {
  const appConfig = useAppConfig();
  const feedbackButtonLabel =
    appConfig.header.feedbackButtonLabel?.trim() || undefined;

  return (
    <div className="flex justify-between print:hidden">
      <BackToResultsButton />
      <div className="flex gap-2">
        <PrintButton componentToPrintRef={componentToPrintRef} />
        <ShareButton
          componentToPrintRef={componentToPrintRef}
          title={resource.name || ''}
          body={resource.description || ''}
        />
        <AddToFavoritesButton
          serviceAtLocationId={resource.id}
          resourceName={resource.name ?? undefined}
        />
        {appConfig.featureFlags.showFeedbackButtonOnResourcePages ? (
          <ReportButton customText={feedbackButtonLabel} />
        ) : null}
      </div>
    </div>
  );
}
