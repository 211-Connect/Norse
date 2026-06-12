'use client';

import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { ReportButton } from '@/app/(app)/shared/components/report-button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { Resource } from '@/types/resource';

import { BackToResultsButton } from './back-to-results-button';

export function Navigation({
  componentToPrintRef,
  resource,
  printableDirectoryData,
}: {
  componentToPrintRef: React.RefObject<HTMLElement | null>;
  resource: Resource;
  printableDirectoryData: PrintableDirectoryData;
}) {
  const appConfig = useAppConfig();
  const feedbackButtonLabel =
    appConfig.header.feedbackButtonLabel?.trim() || undefined;

  return (
    <div className="flex justify-between print:hidden">
      <BackToResultsButton />
      <div className="flex gap-2">
        <DirectoryPrintControl data={printableDirectoryData} />
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
