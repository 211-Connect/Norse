import qs from 'qs';

import { type SearchPin } from '@/app/(app)/features/search/utils/map-pins';
import { getApiHeaders } from '@/lib/api';
import { SearchPinsResponseDto } from '@/lib/api/generated/data-contracts';
import { createLogger } from '@/lib/logger';
import { ONE_HOUR, stableHash, withCache } from '@/utilities/withCache';

import { API_URL } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';
import { formatAddressForDisplay } from '../lib/utils';

const log = createLogger('search-pins');

async function findResourcePinsOrigin(
  params: Record<string, unknown>,
  locale: string,
  tenantId: string,
): Promise<SearchPin[] | null> {
  try {
    const data = await fetchWrapper<SearchPinsResponseDto>(
      `${API_URL}/search/pins?${qs.stringify(params)}`,
      { headers: await getApiHeaders(tenantId, locale) },
    );

    return (
      data?.pins.map((pin) => ({
        id: pin.id,
        resourceId: pin.service_at_location_id,
        name: pin.name,
        address: formatAddressForDisplay(
          pin.physical_address as Parameters<typeof formatAddressForDisplay>[0],
        ),
        coordinates: pin.coordinates as [number, number],
      })) ?? null
    );
  } catch (err) {
    log.error({ err, tenantId, locale }, 'Search pins API error');
    return null;
  }
}

/**
 * Longer than the 1 h of search results: pins are large (up to 10,000 per
 * search), so after an import the map can lag the list by up to 5 h.
 */
const SEARCH_PINS_CACHE_TTL = 6 * ONE_HOUR;

/**
 * Pins for every result of a search, or null when the Norse API fails. Not a
 * Server Action: only `/api/search-pins` calls it, with the tenant of the host.
 *
 * @param params  From `parsePinsQuery`; `locale` and `tenant_id` are set here.
 */
export async function findResourcePins(
  params: Record<string, unknown>,
  locale: string,
  tenantId: string,
): Promise<SearchPin[] | null> {
  const request = { ...params, locale, tenant_id: tenantId };

  return withCache(
    `search_pins:${tenantId}:${locale}:${stableHash(request)}`,
    () => findResourcePinsOrigin(request, locale, tenantId),
    // An empty list is cached too: a search with no located results stays one.
    // A failure is null, which is never cached.
    { redis: true, memory: false, ttl: SEARCH_PINS_CACHE_TTL },
  ).catch((err) => {
    log.error({ err, tenantId, locale }, 'Search pins cache error');
    return null;
  });
}
