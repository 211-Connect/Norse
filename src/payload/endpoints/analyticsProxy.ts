import type { Endpoint } from 'payload';

import {
  analyticsApiClient,
  crawlerTrafficInternalApiClient,
} from '@/lib/api/clients';
import { isSuperAdmin } from '@/payload/collections/Users/access/roles';

import { resolveAnalyticsContext } from '../utilities/resolveAnalyticsContext';
import { getApiHeaders } from '@/lib/api';

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
    const tenantApiHeaders = await getApiHeaders(tenantId);
    const ctx: ResolvedCtx = {
      headers: {
        'x-analytics-api-key': resolved.apiKey,
        ...tenantApiHeaders,
      },
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
  (ctx) =>
    analyticsApiClient.analyticsControllerGetInfo({ headers: ctx.headers }),
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

const pageviewsEndpoint = proxyEndpoint(
  '/analytics/pageviews',
  (ctx, query) => {
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
  },
);

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
  (ctx) =>
    analyticsApiClient.analyticsControllerGetEventCatalog({
      headers: ctx.headers,
    }),
  { skipWebsiteIdValidation: true },
);

/**
 * Requests blocked as bots (ISS-2366). Counted per tenant by Norse, not by
 * Umami, so the selected websites do not apply.
 */
const blockedTrafficEndpoint = proxyEndpoint(
  '/analytics/blocked-traffic',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetBlockedTraffic(
      { start, end },
      { headers: ctx.headers },
    );
  },
  { skipWebsiteIdValidation: true },
);

type Granularity = 'hour' | 'day';

function granularityParam(value: unknown): Granularity {
  return value === 'hour' ? 'hour' : 'day';
}

/**
 * Requests per crawler and outcome (blocked, logged, rate-limited, allowed,
 * load-limited), counted per tenant by Norse, not by Umami, so the selected
 * websites do not apply.
 */
const crawlerTrafficEndpoint = proxyEndpoint(
  '/analytics/crawler-traffic',
  (ctx, query) => {
    const start = toISO(query?.startAt as string);
    const end = toISO(query?.endAt as string);
    return analyticsApiClient.analyticsControllerGetCrawlerTraffic(
      { start, end, granularity: granularityParam(query?.granularity) },
      { headers: ctx.headers },
    );
  },
  { skipWebsiteIdValidation: true },
);

/**
 * The same counts across every tenant, for super admins only. Norse-API's
 * cross-tenant route is internal (internal API key, no tenant), so the role
 * is checked here.
 */
const crawlerTrafficAllTenantsEndpoint = makeEndpoint(
  '/analytics/crawler-traffic-all-tenants',
  async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdmin(req.user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      return Response.json(
        { error: 'INTERNAL_API_KEY is not configured' },
        { status: 500 },
      );
    }

    try {
      const response =
        await crawlerTrafficInternalApiClient.crawlerTrafficAllTenantsInternalControllerGetAllTenants(
          {
            start: toISO(req.query?.startAt as string),
            end: toISO(req.query?.endAt as string),
            granularity: granularityParam(req.query?.granularity),
          },
          {
            headers: {
              'x-api-version': '1',
              'x-internal-api-key': internalApiKey,
            },
            cache: 'no-store',
          },
        );
      return Response.json(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        {
          error: 'Failed to fetch /analytics/crawler-traffic-all-tenants',
          detail: message,
        },
        { status: 502 },
      );
    }
  },
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
  blockedTrafficEndpoint,
  crawlerTrafficEndpoint,
  crawlerTrafficAllTenantsEndpoint,
];
