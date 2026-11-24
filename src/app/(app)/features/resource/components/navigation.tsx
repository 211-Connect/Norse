'use client';

import { AddToFavoritesButton } from '@/app/(app)/shared/components/add-to-favorites-button';
import { DirectoryPrintControl } from '@/app/(app)/shared/components/directory-print/directory-print-control';
import { useDefaultDirectoryPdfDocument } from '@/app/(app)/shared/components/directory-print/use-default-directory-pdf-document';
import { ReportButton } from '@/app/(app)/shared/components/report-button';
import { ShareButton } from '@/app/(app)/shared/components/share-button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { PrintableDirectoryData } from '@/app/(app)/shared/utils/printable-directory-transformers';
import { Resource } from '@/types/resource';

import { BackToResultsButton } from './back-to-results-button';

export function Navigation({
  resource,
  loadPrintableDirectoryData,
}: {
  resource: Resource;
  loadPrintableDirectoryData: (
    locale: string,
  ) => Promise<PrintableDirectoryData>;
}) {
  const appConfig = useAppConfig();
  const renderPdfDocument = useDefaultDirectoryPdfDocument();
  const feedbackButtonLabel =
    appConfig.header.feedbackButtonLabel?.trim() || undefined;

  return (
    <div className="flex flex-wrap items-start gap-2 sm:justify-between print:hidden">
      <BackToResultsButton />
      {/* On phones the actions join the back button's row and wrap with it. */}
      <div className="flex flex-wrap justify-end gap-2 max-sm:contents">
        <DirectoryPrintControl
          loadData={loadPrintableDirectoryData}
          renderDocument={renderPdfDocument}
        />
        <ShareButton
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
