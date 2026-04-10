import { forwardGeocode } from '../../../../../app/(app)/shared/serverActions/geocoding/forwardGeocode';
import type { HeatmapPoint } from './AnalyticsMap';
import { UmamiSession } from './types';

async function runBatch<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

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

  const geocoded = await runBatch(
    uniqueLocations,
    5,
    async ([locationString, views]) => {
      try {
        // TODO: We should be able to send batch request
        const geocodeResults = await forwardGeocode(locationString, {
          locale: 'en',
          tenantId,
          provider: 'opencage',
        });

        const hit = geocodeResults.find((r) => r.type === 'coordinates');
        if (!hit) return null;
        return { coordinates: hit.coordinates, views };
      } catch {
        return null;
      }
    },
  );

  const valid = geocoded.filter(
    (r): r is { coordinates: [number, number]; views: number } => r !== null,
  );

  if (valid.length === 0) return [];

  return normalizeToHeatmapPoints(valid);
}
