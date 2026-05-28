'use client';

import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { useLocalFavoriteResources } from '@/app/(app)/shared/hooks/use-local-favorite-resources';

import { LocalFavoriteMapContainer } from './local-favorite-map-container';
import { LocalFavoritesSection } from './local-favorites-section';

type LocalFavoritesWithMapProps = {
  cardLayout: SearchCardLayoutConfig;
  locale: string;
  tenantId?: string;
};

export function LocalFavoritesWithMap({
  cardLayout,
  locale,
  tenantId,
}: LocalFavoritesWithMapProps) {
  const { resources, loading, setResources } = useLocalFavoriteResources({
    locale,
    tenantId,
  });

  return (
    <div className="flex flex-1">
      <LocalFavoritesSection
        cardLayout={cardLayout}
        resources={resources}
        loading={loading}
        setResources={setResources}
      />
      <LocalFavoriteMapContainer resources={resources} />
    </div>
  );
}
