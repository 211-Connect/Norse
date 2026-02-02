import { executeSearch } from '../utils/searchServiceUtils';
import { deriveQueryType } from '../lib/search-utils';
import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { buildSearchRequest } from '../lib/search-utils';
import { FindResourcesResult, SearchStoreState } from '@/types/search';

export function createUrlParamsForSearch(searchStore: SearchStoreState) {
  const hasLocation = searchStore['searchCoordinates']?.length === 2;

  const urlParams = {
    query: searchStore['query']?.trim(),
    query_label: searchStore['queryLabel']?.trim(),
    query_type: deriveQueryType(searchStore['query'], searchStore['queryType']),
    location: hasLocation ? searchStore['searchLocation']?.trim() : null,
    coords: hasLocation
      ? searchStore['searchCoordinates']?.join(',')?.trim()
      : null,
    distance:
      searchStore['searchCoordinates']?.length === 2
        ? searchStore['searchDistance']?.trim() || '0'
        : '',
  };

  return Object.fromEntries(
    Object.entries(urlParams).filter(
      ([_, value]) =>
        value != null && (typeof value !== 'string' || value.trim() !== ''),
    ),
  ) as Record<string, string>;
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
