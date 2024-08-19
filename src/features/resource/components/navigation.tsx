import { AddToFavoritesButton } from '@/shared/components/add-to-favorites-button';
import { ShareButton } from '@/shared/components/share-button';
import { BackToResultsButton } from './back-to-results-button';

export function Navigation({ componentToPrintRef, resource }) {
  return (
    <div className="flex justify-between">
      <BackToResultsButton />

      <div className="flex gap-2">
        <ShareButton
          componentToPrintRef={componentToPrintRef}
          title={resource.name}
          body={resource.description}
        />
        <AddToFavoritesButton />
      </div>
    </div>
  );
}
