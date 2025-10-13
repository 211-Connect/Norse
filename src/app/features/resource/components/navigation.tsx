import { AddToFavoritesButton } from '@/app/shared/components/add-to-favorites-button';
import { ReportButton } from '@/app/shared/components/report-button';
import { PrintButton } from '@/app/shared/components/print-button';
import { ShareButton } from '@/app/shared/components/share-button';

import { BackToResultsButton } from './back-to-results-button';

export function Navigation({ componentToPrintRef, resource }) {
  return (
    <div className="flex justify-between print:hidden">
      <BackToResultsButton />
      <div className="flex gap-2">
        <PrintButton componentToPrintRef={componentToPrintRef} />
        <ShareButton
          componentToPrintRef={componentToPrintRef}
          title={resource.name}
          body={resource.description}
        />
        <AddToFavoritesButton serviceAtLocationId={resource.id} />
        <ReportButton />
      </div>
    </div>
  );
}
