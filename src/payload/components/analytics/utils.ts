import type {
  MetricEntry,
  MetricsExpandedEntry,
  ResourceTitleEntry,
} from './types';

const SEARCH_RESOURCE_PREFIX = '/search/';

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

  return `/api/umami-proxy?${params.toString()}`;
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
  searchByLabel: MetricEntry[];
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

  const labelMap = new Map<string, number>();
  for (const m of queryMetricsData) {
    const label = new URLSearchParams(m.name).get('query_label');
    if (label === null) continue;
    labelMap.set(
      label,
      (labelMap.get(label) ?? 0) + (Number(m.pageviews) || 0),
    );
  }
  const searchByLabel: MetricEntry[] = Array.from(labelMap, ([x, y]) => ({
    x,
    y,
  })).sort((a, b) => b.y - a.y);

  return { searchCount, resourceMetrics, searchByLabel };
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
