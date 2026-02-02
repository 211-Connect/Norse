import { executeSearch } from '../utils/searchServiceUtils';
import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { buildSearchRequest } from '../lib/search-utils';
import { FindResourcesResult, SearchStoreState } from '@/types/search';
import { geocodeLocationCached } from '../services/geocoding-service';

/**
 * Orchestrate search with feature flags and server-side geocoding.
 * This function effectively replaces the old logic in page.tsx.
 */
export async function getSearchResults(
  searchParams: Record<string, string | string[] | undefined>,
  locale: string,
  limit: number,
  tenantId?: string,
): Promise<FindResourcesResult> {
  const page = parseInt((searchParams?.page as string) ?? '1');
  const location = searchParams?.location as string | undefined;

  // Feature flag check
  const useGeospatialSearch =
    process.env.NEXT_PUBLIC_ADVANCED_GEOSPATIAL_FILTERING_FEATURE_FLAG ===
      'true' && !!location;

  let v2Result: FindResourcesResult | null = null;

  if (useGeospatialSearch) {
    const placeMetadata = await geocodeLocationCached(location!, locale);

    if (placeMetadata) {
      const searchStore = {
        query: (searchParams?.query as string) || '',
        queryLabel: (searchParams?.query_label as string) || '',
        queryType: (searchParams?.query_label as string) || '',
        searchLocation: location!,
        searchCoordinates: searchParams?.coords
          ? (searchParams.coords as string).split(',').map(Number)
          : placeMetadata.coordinates,
        searchDistance: (searchParams?.distance as string) || '0',
        searchPlaceType: placeMetadata.place_type,
        searchBbox: placeMetadata.bbox,
      };

      try {
        v2Result = await findResourcesV2(
          searchStore,
          locale,
          page,
          limit,
          tenantId,
        );
      } catch (error) {
        console.error(
          'Geospatial search failed, falling back to legacy:',
          error,
        );
      }
    }
  }

  if (v2Result) return v2Result;

  return findResources(
    searchParams as Record<string, string>,
    locale,
    page,
    limit,
    tenantId,
  );
}

export async function findResources(
  query: Record<string, string>,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<FindResourcesResult> {
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  const pageStr = isNaN(page) ? '1' : page.toString();
  const limitStr = !limit || isNaN(limit) ? '25' : limit.toString();

  const queryParams = {
    ...query,
    page: pageStr,
    limit: limitStr,
    locale,
  };

  const fallbackQueryParams: Record<string, any> = { ...queryParams };
  if (tenantId) {
    fallbackQueryParams.tenant_id = tenantId;
  }

  return executeSearch(
    fetchWrapper,
    `${API_URL}/search`,
    queryParams,
    locale,
    parseInt(pageStr),
    parseInt(limitStr),
    tenantId,
    'GET',
    null,
    fallbackQueryParams,
  );
}

/**
 * Find resources using POST endpoint with advanced geospatial filtering
 * This is the V2 implementation that supports both boundary and proximity search
 * @param searchStore - Search state from searchAtom
 * @param locale - Language locale
 * @param page - Current page number
 * @param limit - Results per page
 * @param tenantId - Tenant identifier
 * @returns Search results with pagination info
 */
export async function findResourcesV2(
  searchStore: SearchStoreState,
  locale: string,
  page: number,
  limit?: number,
  tenantId?: string,
): Promise<FindResourcesResult> {
  if (isNaN(page)) {
    page = 1;
  }

  if (!limit || isNaN(limit)) {
    limit = 25;
  }

  const request = buildSearchRequest({
    ...searchStore,
    searchPlaceType: searchStore.searchPlaceType || [],
    searchBbox: searchStore.searchBbox || null,
  });

  // Build query params with pagination
  const queryParams = {
    ...request.queryParams,
    page,
    locale,
    limit,
  };

  return executeSearch(
    fetchWrapper,
    `${API_URL}/search`,
    queryParams,
    locale,
    page,
    limit,
    tenantId,
    'POST',
    request.body,
  );
}
