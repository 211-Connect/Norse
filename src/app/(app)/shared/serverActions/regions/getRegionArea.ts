'use server';

import { getApiHeaders, regionApiClient } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { ONE_DAY, withCache } from '@/utilities/withCache';

import type { ServiceAreaGeoJSON } from '../../components/map/map-shared';

const log = createLogger('getRegionArea');

type Geometry = { type: string; coordinates: unknown[] };

/**
 * The searched area for the map: the Regions of a `/search` `region` param
 * (comma list) as one MultiPolygon, or null when none can be drawn.
 * See docs/area-search.md.
 */
export async function getRegionArea(
  region: string,
  tenantId: string,
  locale: string,
): Promise<ServiceAreaGeoJSON | null> {
  const geometries = await Promise.all(
    region.split(',').map((id) =>
      // Boundaries change only when the Region store is reseeded.
      withCache(
        `region:${id}`,
        async () => {
          const response = await regionApiClient.regionPublicControllerGet(
            { id },
            {
              headers: await getApiHeaders(tenantId, locale),
              cache: 'no-store',
            },
          );
          return response.data.geometry as Geometry;
        },
        { redis: true, memory: true, ttl: ONE_DAY },
      ).catch((err) => {
        log.warn({ err, id }, 'Region boundary unavailable');
        return null;
      }),
    ),
  );

  const polygons = geometries.flatMap((geometry) =>
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : [],
  );

  return polygons.length > 0
    ? { type: 'MultiPolygon', coordinates: polygons }
    : null;
}
