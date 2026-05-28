import { forwardGeocodeBatch } from '../../../app/(app)/shared/serverActions/geocoding/forwardGeocodeBatch';
import type { HeatmapPoint } from './types';
import { UmamiSession } from './types';

const BATCH_SIZE = 50; // API maximum per request

function normalizeToHeatmapPoints(
  valid: { coordinates: [number, number]; views: number }[],
): HeatmapPoint[] {
  const maxViews = Math.max(...valid.map((r) => r.views));
  return valid.map(({ coordinates, views }) => [
    coordinates[0],
    coordinates[1],
    Math.max(0.1, views / maxViews),
  ]);
}

export async function geocodeSessions(
  sessions: UmamiSession[],
  tenantId: string | undefined,
): Promise<HeatmapPoint[]> {
  const viewsByLocation = new Map<string, number>();
  sessions.forEach((session) => {
    const key = `${session.city}, ${session.region}, ${session.country}`;
    viewsByLocation.set(
      key,
      (viewsByLocation.get(key) ?? 0) + (session.views ?? 1),
    );
  });

  if (viewsByLocation.size === 0) return [];

  const uniqueLocations = Array.from(viewsByLocation.entries()); // [locationString, views]

  // Split into chunks of BATCH_SIZE and call the batch API sequentially
  const valid: { coordinates: [number, number]; views: number }[] = [];

  for (let i = 0; i < uniqueLocations.length; i += BATCH_SIZE) {
    const chunk = uniqueLocations.slice(i, i + BATCH_SIZE);
    const addresses = chunk.map(([locationString]) => locationString);

    let batchResults;
    try {
      batchResults = await forwardGeocodeBatch(addresses, {
        locale: 'en',
        tenantId,
        provider: 'opencage',
      });
    } catch {
      // If the whole batch request fails, skip this chunk
      continue;
    }

    for (const item of batchResults) {
      if (item.error) continue;

      const hit = item.results.find((r) => r.type === 'coordinates');
      if (!hit) continue;

      const views = viewsByLocation.get(item.address) ?? 1;
      valid.push({ coordinates: hit.coordinates, views });
    }
  }

  if (valid.length === 0) return [];

  return normalizeToHeatmapPoints(valid);
}
