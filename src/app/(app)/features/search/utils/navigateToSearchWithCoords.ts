'use server';

import qs from 'qs';
import { redirect } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import type { RawSearchParams } from './parseSearchParams';

const log = createLogger('navigateToSearchWithCoords');

export async function navigateToSearchWithCoords(
  locale: string,
  searchQuery: FindResourcesQuery,
  rawParams: RawSearchParams,
) {
  log.debug(
    { searchQuery, locale },
    'No coordinates provided for location; attempting forward geocode',
  );

  if (!searchQuery.location) {
    log.warn(
      { searchQuery, locale },
      'No location provided for forward geocode; cannot navigate to search with coordinates',
    );
    return;
  }

  const [placeMetadata] = await forwardGeocode(searchQuery.location, {
    locale,
  });

  if (placeMetadata) {
    const redirectQueryString = qs.stringify(
      { ...rawParams, coords: placeMetadata.coordinates.join(',') },
      { addQueryPrefix: true },
    );
    redirect(`/${locale}/search${redirectQueryString}`);
  } else {
    log.warn(
      { searchQuery, locale },
      'Forward geocode failed; continuing without coordinates',
    );
  }
}
