import { regionApiClient } from '@/lib/api/clients';
import { getApiHeaders } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { isRegionId } from '@/types/areaSearch';
import { ONE_DAY, withCache } from '@/utilities/withCache';

import { type ServiceAreaGeoJSON } from '../components/map/map-shared';

const log = createLogger('region-area');

/** The outline of a searched area, drawn on the search map (see docs/area-search.md). */
export type RegionArea = {
  id: string;
  name: string;
  geometry: ServiceAreaGeoJSON;
};

async function getRegionAreaOrigin(
  id: string,
  tenantId: string,
): Promise<RegionArea | null> {
  const response = await regionApiClient.regionPublicControllerGet(
    { id },
    { headers: await getApiHeaders(tenantId) },
  );
  const region = response.data;
  if (!region?.geometry) return null;

  return {
    id: region.id,
    name: region.name,
    geometry: region.geometry as ServiceAreaGeoJSON,
  };
}

/**
 * A Region's outline, or null when the id is invalid or the Norse API fails.
 * Boundaries are the same for every tenant and change only on a reseed, so
 * the cache key has no tenant and the entry lives a day. Not a Server Action:
 * only `/api/region-area` calls it, with the tenant of the host.
 */
export async function getRegionArea(
  id: string,
  tenantId: string,
): Promise<RegionArea | null> {
  if (!isRegionId(id)) return null;

  return withCache(
    `region_area:${id}`,
    () => getRegionAreaOrigin(id, tenantId),
    { redis: true, memory: true, ttl: ONE_DAY },
  ).catch((err) => {
    log.error({ err, tenantId, regionId: id }, 'Region area fetch failed');
    return null;
  });
}
