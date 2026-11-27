import { regionApiClient } from '@/lib/api/clients';
import type { StateRegionDto } from '@/lib/api/generated/data-contracts';
import { getApiHeaders } from '@/lib/api';
import { ONE_DAY, withCache } from '@/utilities/withCache';

export type StateRegion = StateRegionDto;

const STATE_CODE = /^[A-Z]{2}$/;

/** `wa` → `WA`, or null when it is not a two-letter postal code. */
export function normalizeStateCode(state: string): string | null {
  const code = state.trim().toUpperCase();
  return STATE_CODE.test(code) ? code : null;
}

/**
 * Every county and place of a state, sorted by name, for the landing-page
 * region picker (docs/landing-pages.md). Norse-API `GET /regions` takes a few
 * seconds (one search per county), and the catalog changes only when Dagster
 * publishes, so the answer is cached in Redis for a day. The catalog is the
 * same for every tenant, so the key has no tenant; the tenant id is only the
 * one every Norse API request must carry.
 */
export async function getStateRegions(
  state: string,
  tenantId: string,
): Promise<StateRegion[]> {
  if (!tenantId) throw new Error('getStateRegions: tenant id is required');
  const code = normalizeStateCode(state);
  if (!code) throw new Error(`getStateRegions: invalid state "${state}"`);

  const regions = await withCache(
    `state_regions:${code}`,
    async () => {
      const response = await regionApiClient.regionPublicControllerListByState(
        { state: code },
        { headers: await getApiHeaders(tenantId) },
      );
      return response.data.items;
    },
    { redis: true, memory: false, ttl: ONE_DAY },
  );
  return regions ?? [];
}
