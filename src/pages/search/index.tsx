import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nookies from 'nookies';
import { SearchView } from '@/features/search/views/search-view';
import {
  cacheControl,
  serverSideAppConfig,
  serverSideFlags,
} from '@/shared/lib/server-utils';
import {
  USER_PREF_COORDS,
  USER_PREF_DISTANCE,
  USER_PREF_LOCATION,
} from '@/shared/lib/constants';
import { SearchService } from '@/shared/services/search-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { getServerDevice } from '@/shared/lib/get-server-device';
import {
  parseAndValidateCoords,
  cleanLocationString,
} from '@/shared/lib/utils';
import { MapService } from '@/shared/services/map-service';
import { MapboxAdapter } from '@/shared/adapters/geocoder/mapbox-adapter';

/**
 * Server-side geocoding fallback when coords are missing/invalid but location exists.
 */
async function geocodeLocationServer(
  location: string,
  locale: string | undefined,
): Promise<[number, number] | null> {
  try {
    const adapter = new MapboxAdapter();
    const results = await MapService.forwardGeocode(location, {
      adapter,
      locale: locale ?? 'en',
    });

    const firstResult = results?.[0];
    if (firstResult?.coordinates && Array.isArray(firstResult.coordinates)) {
      const [lng, lat] = firstResult.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number') {
        console.log(`Geocoded "${location}" to coords: [${lng}, ${lat}]`);
        return [lng, lat];
      }
    }

    console.warn(`Geocoding returned no valid results for: ${location}`);
    return null;
  } catch (error) {
    console.error('Server-side geocoding error:', error);
    return null;
  }
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);
  const appConfig = (await serverSideAppConfig()).appConfig;
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const device = getServerDevice(ctx.req.headers['user-agent']);

  // Validate and clean coords from query
  const validatedCoords = parseAndValidateCoords(ctx.query.coords);
  let finalCoords: string | null = validatedCoords
    ? validatedCoords.join(',')
    : null;

  // Clean duplicated location values
  const finalLocation = cleanLocationString(ctx.query.location);

  // If coords are invalid/missing but location exists, try to geocode
  if (!finalCoords && finalLocation) {
    console.log(`Geocoding location server-side: ${finalLocation}`);
    const geocodedCoords = await geocodeLocationServer(
      finalLocation,
      ctx.locale,
    );

    if (geocodedCoords) {
      finalCoords = geocodedCoords.join(',');
    }
  }

  // If the user still has no location/coords, but they exist in cookies,
  // redirect them to the url using their stored location and coords
  if (!finalLocation || !finalCoords) {
    if (cookies[USER_PREF_LOCATION] && cookies[USER_PREF_COORDS]) {
      const newQuery = new URLSearchParams(ctx.resolvedUrl.split('?')[1]);
      newQuery.set('location', cookies[USER_PREF_LOCATION]);
      newQuery.set('coords', cookies[USER_PREF_COORDS]);

      const distance = cookies[USER_PREF_DISTANCE];
      if (distance) {
        newQuery.set('distance', distance);
      }

      return {
        redirect: {
          destination: `/${ctx.locale}/search?${newQuery.toString()}`,
          permanent: false,
        },
      };
    }
  }

  // Build cleaned query with validated/geocoded values for downstream use
  const cleanedQuery = { ...ctx.query };
  if (finalCoords) {
    cleanedQuery.coords = finalCoords;
  } else {
    delete cleanedQuery.coords;
  }
  if (finalLocation) {
    cleanedQuery.location = finalLocation;
  }

  const limit = appConfig.search.resultsLimit;
  const { results, noResults, totalResults, page, filters } =
    await SearchService.findResources(cleanedQuery, {
      locale: ctx.locale,
      page: parseInt((ctx?.query?.page as string) ?? ''),
      limit,
    });

  cacheControl(ctx);

  return {
    props: {
      device,
      results,
      noResults,
      filters,
      totalResults,
      currentPage: page,
      query: ctx.query?.query ?? null,
      query_label: ctx.query?.query_label ?? null,
      query_type: ctx.query?.query_type ?? null,
      location: finalLocation,
      distance: ctx.query?.distance ?? null,
      coords: finalCoords,
      appConfig: appConfig,
      session,
      ...(await serverSideFlags()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-search',
        'page-resource',
        'common',
        'dynamic',
        'categories',
        'suggestions',
      ])),
    },
  };
}

export default SearchView;
