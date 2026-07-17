import type { Endpoint } from 'payload';

import { analyticsApiClient } from '@/lib/api/clients';

import { resolveAnalyticsContext } from '../utilities/resolveAnalyticsContext';

function makeEndpoint(
  path: string,
  handler: (req: any) => Promise<Response>,
): Endpoint {
  return { path, method: 'get', handler };
}

class ProxyValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function toISO(ms: string | undefined): string {
  if (!ms) return '';
  const clamped = Math.min(Number(ms), Date.now());
  return new Date(clamped).toISOString();
}

function commonHeaders(
  apiKey: string,
  tenantId: string,
): Record<string, string> {
  return {
    'x-analytics-api-key': apiKey,
    'x-tenant-id': tenantId,
    'x-api-version': '1',
  };
}

function websiteIdsParam(ids: string[]): { websiteIds: string } | object {
  return ids.length > 0 ? { websiteIds: ids.join(',') } : {};
}

type ResolvedCtx = {
  headers: Record<string, string>;
  selectedWebsiteIds: string[];
};

/**
 * Wraps a proxy endpoint with auth resolution + uniform error handling.
 * `call` receives a pre-resolved context (headers + selected website IDs)
 * and the raw query object, and returns the SDK response to forward.
 */
function proxyEndpoint(
  path: string,
  call: (ctx: ResolvedCtx, query: any) => Promise<{ data: any }>,
  options?: { skipWebsiteIdValidation?: boolean },
): Endpoint {
  return makeEndpoint(path, async (req) => {
    const resolved = await resolveAnalyticsContext(req, options);
    if (resolved instanceof Response) return resolved;

    const tenantId = req.query?.tenantId as string;
    const ctx: ResolvedCtx = {
      headers: commonHeaders(resolved.apiKey, tenantId),
      selectedWebsiteIds: resolved.selectedWebsiteIds,
    };

    try {
      const response = await call(ctx, req.query);
      return Response.json(response.data);
    } catch (err) {
      if (err instanceof ProxyValidationError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: `Failed to fetch ${path}`, detail: message },
        { status: 502 },
      );
    }
  });
}

const infoEndpoint = proxyEndpoint(
  '/analytics/info',
  (ctx) => analyticsApiClient.analyticsControllerGetInfo({ headers: ctx.headers }),
  { skipWebsiteIdValidation: true },
);

const statsEndpoint = proxyEndpoint('/analytics/stats', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  return analyticsApiClient.analyticsControllerGetStats(
    { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
    { headers: ctx.headers },
  );
});

const pageviewsEndpoint = proxyEndpoint('/analytics/pageviews', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  return analyticsApiClient.analyticsControllerGetPageviews(
    {
      start,
      end,
      timezone: 'UTC',
      ...websiteIdsParam(ctx.selectedWebsiteIds),
    },
    { headers: ctx.headers },
  );
});

const metricsEndpoint = proxyEndpoint('/analytics/metrics', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  return analyticsApiClient.analyticsControllerGetMetrics(
    {
      start,
      end,
      timezone: 'UTC',
      ...websiteIdsParam(ctx.selectedWebsiteIds),
    },
    { headers: ctx.headers },
  );
});

const resourceMetricsEndpoint = proxyEndpoint(
  '/analytics/resource-metrics',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetResourceMetrics(
      { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
      { headers: ctx.headers },
    );
  },
);

const searchesEndpoint = proxyEndpoint('/analytics/searches', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  return analyticsApiClient.analyticsControllerGetSearches(
    { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
    { headers: ctx.headers },
  );
});

const zeroResultQueriesEndpoint = proxyEndpoint(
  '/analytics/zero-result-queries',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetZeroResultQueries(
      { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
      { headers: ctx.headers },
    );
  },
);

const languageSwitchesEndpoint = proxyEndpoint(
  '/analytics/language-switches',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetLanguageSwitches(
      { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
      { headers: ctx.headers },
    );
  },
);

const resourceByEntryEndpoint = proxyEndpoint(
  '/analytics/resource-by-entry',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetResourceByEntry(
      { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
      { headers: ctx.headers },
    );
  },
);

const sessionsEndpoint = proxyEndpoint('/analytics/sessions', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  const page = query?.page ? Number(query.page) : undefined;
  const limit = query?.limit ? Number(query.limit) : undefined;
  return analyticsApiClient.analyticsControllerGetSessions(
    {
      start,
      end,
      ...websiteIdsParam(ctx.selectedWebsiteIds),
      ...(page ? { page } : {}),
      ...(limit ? { limit } : {}),
    },
    { headers: ctx.headers },
  );
});

const heatmapEndpoint = proxyEndpoint('/analytics/heatmap', (ctx, query) => {
  const start = toISO(query?.startAt as string);
  const end = toISO(query?.endAt as string);
  return analyticsApiClient.analyticsControllerGetHeatmap(
    { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
    { headers: ctx.headers },
  );
});

const areaSearchesEndpoint = proxyEndpoint(
  '/analytics/area-searches',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetAreaSearches(
      { start, end, ...websiteIdsParam(ctx.selectedWebsiteIds) },
      { headers: ctx.headers },
    );
  },
);

const eventValuesEndpoint = proxyEndpoint(
  '/analytics/event-values',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    const event = query?.event as string | undefined;
    const property = query?.property as string | undefined;

    if (!event || !property) {
      return Promise.reject(
        new ProxyValidationError('Missing event or property parameters.'),
      );
    }

    return analyticsApiClient.analyticsControllerGetEventValues(
      {
        start,
        end,
        event,
        property,
        ...websiteIdsParam(ctx.selectedWebsiteIds),
      },
      { headers: ctx.headers },
    );
  },
);

const eventCatalogEndpoint = proxyEndpoint(
  '/analytics/event-catalog',
  (ctx) => analyticsApiClient.analyticsControllerGetEventCatalog({ headers: ctx.headers }),
  { skipWebsiteIdValidation: true },
);

export const analyticsProxyEndpoints: Endpoint[] = [
  infoEndpoint,
  statsEndpoint,
  pageviewsEndpoint,
  metricsEndpoint,
  resourceMetricsEndpoint,
  searchesEndpoint,
  zeroResultQueriesEndpoint,
  languageSwitchesEndpoint,
  resourceByEntryEndpoint,
  sessionsEndpoint,
  heatmapEndpoint,
  areaSearchesEndpoint,
  eventValuesEndpoint,
  eventCatalogEndpoint,
];
