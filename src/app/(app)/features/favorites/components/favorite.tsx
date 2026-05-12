'use client';

import { useTranslation } from 'react-i18next';

import { CardLayoutRenderer } from '@/app/(app)/features/search/components/card-layout-renderer';
import { SearchCardLayoutConfig } from '@/app/(app)/features/search/types/card-layout-config';
import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import { type Favorite as FavoriteType } from '@/app/(app)/shared/store/favorites';
import { ResultType } from '@/app/(app)/shared/store/results';
import { transformFacetsToArray } from '@/app/(app)/shared/utils/toFacetsWithTranslation';

function convertFavoriteToResult(
  favorite: FavoriteType,
  locale: string,
  currentListId?: string,
  onRemoveFromList?: (listId: string, favoriteId: string) => void,
): ResultType {
  const translation = favorite.translations.find((el) => el.locale === locale);

  const address = favorite.addresses?.find(
    (el) => el.rank === 1 && el.type === 'physical',
  );
  const displayAddress = formatAddressForDisplay(address);

  const transformedFacets = transformFacetsToArray(
    favorite.facetsEn,
    {}, // facet definitions not needed for display
    locale,
  );

  return {
    _id: favorite._id,
    id: favorite._id,
    address: displayAddress ?? '',
    summary: translation?.serviceDescription ?? '',
    description: translation?.serviceDescription ?? '',
    location: favorite.location ?? null,
    locationName: favorite.locationName ?? null,
    name: translation?.displayName ?? favorite.displayName ?? '',
    phone: favorite.displayPhoneNumber ?? '',
    attribution: favorite.attribution ?? null,
    priority: 0,
    serviceName: translation?.serviceName ?? '',
    website: favorite.website ?? '',
    taxonomies: translation?.taxonomies ?? [],
    facets: transformedFacets.length > 0 ? transformedFacets : null,
    attributeValues: translation?.attributeValues ?? {},
    currentListId,
    onRemoveFromList,
  };
}

export function Favorite({
  data,
  cardLayout,
  currentListId,
  onRemoveFromList,
}: {
  data: FavoriteType;
  cardLayout: SearchCardLayoutConfig;
  currentListId?: string;
  onRemoveFromList?: (listId: string, favoriteId: string) => void;
}) {
  const { i18n } = useTranslation();

  const result = convertFavoriteToResult(
    data,
    i18n.language,
    currentListId,
    onRemoveFromList,
  );

  return <CardLayoutRenderer layout={cardLayout} result={result} />;
}
