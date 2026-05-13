'use client';

import { formatAddressForDisplay } from '@/app/(app)/shared/lib/utils';
import { type Favorite as FavoriteType } from '@/app/(app)/shared/store/favorites';
import { ResultType } from '@/app/(app)/shared/store/results';
import { transformFacetsToArray } from '@/app/(app)/shared/utils/toFacetsWithTranslation';
import { Resource } from '@/types/resource';

export type RemoveFromListHandler = (
  listId: string,
  favoriteId: string,
) => void;

const LOCAL_LIST_ID = 'local';

export function favoriteToResult(
  favorite: FavoriteType,
  locale: string,
  currentListId?: string,
  onRemoveFromList?: RemoveFromListHandler,
): ResultType {
  const translation = favorite.translations.find((el) => el.locale === locale);

  const address = favorite.addresses?.find(
    (el) => el.rank === 1 && el.type === 'physical',
  );
  const displayAddress = formatAddressForDisplay(address);

  const transformedFacets = transformFacetsToArray(
    favorite.facetsEn,
    {},
    locale,
  );

  return {
    _id: favorite._id,
    id: favorite._id,
    address: displayAddress ?? '',
    summary:
      translation?.serviceSummary ?? translation?.serviceDescription ?? '',
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

export function resourceToLocalFavoriteResult(
  resource: Resource,
  onRemoveFromList: RemoveFromListHandler,
): ResultType {
  return {
    _id: resource.id,
    id: resource.id,
    address: resource.address ?? '',
    summary: resource.description ?? '',
    description: resource.description ?? '',
    location: resource.location?.coordinates
      ? {
          type: 'Point',
          coordinates: resource.location.coordinates,
        }
      : null,
    locationName: resource.locationName ?? null,
    name: resource.name ?? '',
    phone: resource.phone ?? '',
    attribution: resource.attribution ?? null,
    priority: 0,
    serviceName: resource.serviceName ?? '',
    website: resource.website ?? null,
    taxonomies: resource.categories ?? [],
    facets: resource.facets ?? null,
    attributeValues: resource.attributeValues ?? {},
    currentListId: LOCAL_LIST_ID,
    onRemoveFromList,
  };
}
