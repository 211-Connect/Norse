import dayjs from 'dayjs';

import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';
import type {
  MetricEntry,
  MetricsExpandedEntry,
  ResourceTitleEntry,
  SearchByLabelByType,
  SearchQueryType,
} from './types';

const SEARCH_RESOURCE_PREFIX = '/search/';

const SEARCH_QUERY_TYPES: readonly SearchQueryType[] = [
  'text',
  'taxonomy',
  'hybrid',
] as const;

/**
 * Validates a custom date range.
 * @param start - Start date in YYYY-MM-DD format
 * @param end - End date in YYYY-MM-DD format
 * @returns Error message if invalid, null if valid
 */
export function validateDateRange(start: string, end: string): string | null {
  if (!start || !end) {
    return 'Both start and end dates are required';
  }

  const startDate = dayjs(start);
  const endDate = dayjs(end);
  const today = dayjs();

  if (!startDate.isValid() || !endDate.isValid()) {
    return 'Invalid date format';
  }

  if (endDate.isBefore(startDate)) {
    return 'End date must be after start date';
  }

  if (startDate.isAfter(today) || endDate.isAfter(today)) {
    return 'Dates cannot be in the future';
  }

  const daysDiff = endDate.diff(startDate, 'day');
  if (daysDiff > 365) {
    return 'Date range cannot exceed one year (365 days)';
  }

  return null;
}

function isSearchQueryType(value: string | null): value is SearchQueryType {
  return (
    value !== null && (SEARCH_QUERY_TYPES as readonly string[]).includes(value)
  );
}

export function buildProxyQuery(
  endpoint: string,
  startAt: number,
  endAt: number,
  tenantId?: string | null,
  extra?: Record<string, string>,
  websiteIds?: string[],
): string {
  const params = new URLSearchParams({
    endpoint,
    startAt: String(startAt),
    endAt: String(endAt),
    ...extra,
    ...(tenantId ? { tenantId } : {}),
  });

  if (websiteIds && websiteIds.length > 0) {
    params.set('websiteIds', websiteIds.join(','));
  }

  return withOptionalCustomBasePath(`/api/umami-proxy?${params.toString()}`);
}

export function sumEventTotals(events: MetricEntry[]): Record<string, number> {
  return events.reduce<Record<string, number>>((acc, e) => {
    acc[e.x] = (acc[e.x] ?? 0) + e.y;
    return acc;
  }, {});
}

export function parseMetrics(
  metricsData: MetricsExpandedEntry[],
  queryMetricsData: MetricsExpandedEntry[],
): {
  searchCount: number;
  resourceMetrics: MetricEntry[];
  searchByLabelByType: SearchByLabelByType;
} {
  let searchCount = 0;
  const resourceMetrics: MetricEntry[] = [];

  for (const metricData of metricsData) {
    if (metricData.name === '/search' || metricData.name.endsWith('/search')) {
      searchCount += Number(metricData.pageviews) || 0;
    } else if (metricData.name.includes('/search/')) {
      resourceMetrics.push({
        x: metricData.name,
        y: Number(metricData.pageviews) || 0,
      });
    }
  }

  resourceMetrics.sort((a, b) => b.y - a.y);

  const labelByTypeMaps: Record<SearchQueryType, Map<string, number>> = {
    text: new Map<string, number>(),
    taxonomy: new Map<string, number>(),
    hybrid: new Map<string, number>(),
  };

  for (const m of queryMetricsData) {
    const params = new URLSearchParams(m.name);
    const label = params.get('query_label');
    if (label === null) continue;
    const rawType = params.get('query_type');
    if (!isSearchQueryType(rawType)) continue;
    const views = Number(m.pageviews) || 0;
    const bucket = labelByTypeMaps[rawType];
    bucket.set(label, (bucket.get(label) ?? 0) + views);
  }

  const toSortedEntries = (map: Map<string, number>): MetricEntry[] =>
    Array.from(map, ([x, y]) => ({ x, y })).sort((a, b) => b.y - a.y);

  const searchByLabelByType: SearchByLabelByType = {
    text: toSortedEntries(labelByTypeMaps.text),
    taxonomy: toSortedEntries(labelByTypeMaps.taxonomy),
    hybrid: toSortedEntries(labelByTypeMaps.hybrid),
  };

  return { searchCount, resourceMetrics, searchByLabelByType };
}

export function mergeSearchByLabelBuckets(
  byType: SearchByLabelByType | undefined,
): MetricEntry[] {
  if (!byType) return [];
  const totals = new Map<string, number>();
  for (const type of ['text', 'taxonomy', 'hybrid'] as const) {
    for (const entry of byType[type]) {
      totals.set(entry.x, (totals.get(entry.x) ?? 0) + entry.y);
    }
  }
  return Array.from(totals, ([x, y]) => ({ x, y })).sort((a, b) => b.y - a.y);
}

export function extractResourceId(path: string): string | null {
  const idx = path.indexOf(SEARCH_RESOURCE_PREFIX);
  if (idx === -1) return null;
  const id = path.slice(idx + SEARCH_RESOURCE_PREFIX.length);
  return id.length > 0 ? id : null;
}

export async function enrichWithResourceTitles(
  metrics: MetricEntry[],
  tenantId: string,
): Promise<MetricEntry[]> {
  const ids = metrics
    .map((m) => extractResourceId(m.x))
    .filter((id): id is string => id !== null);

  if (ids.length === 0) {
    return metrics;
  }

  let titleMap = new Map<string, string>();
  try {
    const response = await fetch('/api/resource-titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, tenantId }),
    });
    if (response.ok) {
      const data: ResourceTitleEntry[] = await response.json();
      titleMap = new Map(data.map((entry) => [entry.id, entry.displayName]));
    }
  } catch {
    // silently fall back to raw paths
  }

  return metrics.map((m) => {
    const id = extractResourceId(m.x) ?? m.x;
    return {
      x: titleMap.get(id) ?? id,
      y: m.y,
    };
  });
}
