// Server-only: the search page calls this directly. It is not a Server Action: nothing on the client
// imports it, and a `'use server'` export is a public POST endpoint (tests/search-server-actions.test.ts).
import { redirect } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { forwardGeocode } from '@/app/(app)/shared/serverActions/geocoding/forwardGeocode';
import { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import {
  rewriteSearchUrl,
  type RawSearchParams,
} from '@/app/(app)/features/search/intent';

const log = createLogger('navigateToSearchWithCoords');

export async function navigateToSearchWithCoords(
  locale: string,
  tenantId: string,
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
    tenantId,
  });

  if (placeMetadata) {
    // The URL as received with the geocoded coords: lifted and serialized, so a repeated key is kept as its
    // first value instead of `key[n]` (ISS-2409).
    redirect(
      rewriteSearchUrl(
        rawParams,
        (intent) => ({
          ...intent,
          coords: { stated: true, value: placeMetadata.coordinates },
        }),
        { newSearch: false, basePath: `/${locale}` },
      ),
    );
  } else {
    log.warn(
      { searchQuery, locale },
      'Forward geocode failed; continuing without coordinates',
    );
  }
}
