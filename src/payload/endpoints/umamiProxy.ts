import type { Endpoint } from 'payload';

import { isSuperAdmin, isSupport } from '../collections/Users/access/roles';
import {
  MetricEntry,
  MetricsExpandedEntry,
} from '../components/analytics/types';
import { getUserTenantIDs } from '../utilities/getUserTenantIDs';
import { getUmamiToken } from '../utilities/umamiAuth';

const ALLOWED_ENDPOINTS = [
  'stats',
  'pageviews',
  'metrics',
  'active',
  'events/series',
  'event-data/values',
  'sessions',
  'metrics/expanded',
] as const;

const ALLOWED_PARAMS = [
  'startAt',
  'endAt',
  'unit',
  'timezone',
  'type',
  'limit',
  'page',
  'orderBy',
  'eventName',
  'event',
  'propertyName',
] as const;

function parseRequestedWebsiteIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function configuredWebsiteIds(tenant: any): string[] {
  const websiteIds = Array.isArray(tenant?.common?.umamiWebsiteIds)
    ? tenant.common.umamiWebsiteIds
        .map((row: { websiteId?: string | null }) => row?.websiteId?.trim())
        .filter((id: string | undefined): id is string => Boolean(id))
    : [];

  return Array.from(new Set(websiteIds));
}

function mergeMetricEntries(entriesList: MetricEntry[][]): MetricEntry[] {
  const merged = new Map<string, number>();

  for (const entries of entriesList) {
    for (const entry of entries) {
      merged.set(entry.x, (merged.get(entry.x) ?? 0) + (entry.y ?? 0));
    }
  }

  return Array.from(merged, ([x, y]) => ({ x, y }));
}

function mergeMetricsExpanded(
  dataList: MetricsExpandedEntry[][],
): MetricsExpandedEntry[] {
  const merged = new Map<
    string,
    {
      pageviews: number;
      visitors: number;
      visits: number;
      bounces: number;
      totaltime: number;
    }
  >();

  for (const rows of dataList) {
    for (const row of rows) {
      const current = merged.get(row.name) ?? {
        pageviews: 0,
        visitors: 0,
        visits: 0,
        bounces: 0,
        totaltime: 0,
      };

      current.pageviews += Number(row.pageviews) || 0;
      current.visitors += Number(row.visitors) || 0;
      current.visits += Number(row.visits) || 0;
      current.bounces += Number(row.bounces) || 0;
      current.totaltime += Number(row.totaltime) || 0;

      merged.set(row.name, current);
    }
  }

  return Array.from(merged, ([name, totals]) => ({
    name,
    pageviews: String(totals.pageviews),
    visitors: totals.visitors,
    visits: totals.visits,
    bounces: totals.bounces,
    totaltime: String(totals.totaltime),
  }));
}

function mergeStats(dataList: any[]): any {
  return dataList.reduce(
    (acc, row) => ({
      bounces: acc.bounces + (Number(row?.bounces) || 0),
      pageviews: acc.pageviews + (Number(row?.pageviews) || 0),
      totaltime: acc.totaltime + (Number(row?.totaltime) || 0),
      visitors: acc.visitors + (Number(row?.visitors) || 0),
      visits: acc.visits + (Number(row?.visits) || 0),
      comparison: {
        bounces:
          acc.comparison.bounces + (Number(row?.comparison?.bounces) || 0),
        pageviews:
          acc.comparison.pageviews + (Number(row?.comparison?.pageviews) || 0),
        totaltime:
          acc.comparison.totaltime + (Number(row?.comparison?.totaltime) || 0),
        visitors:
          acc.comparison.visitors + (Number(row?.comparison?.visitors) || 0),
        visits: acc.comparison.visits + (Number(row?.comparison?.visits) || 0),
      },
    }),
    {
      bounces: 0,
      pageviews: 0,
      totaltime: 0,
      visitors: 0,
      visits: 0,
      comparison: {
        bounces: 0,
        pageviews: 0,
        totaltime: 0,
        visitors: 0,
        visits: 0,
      },
    },
  );
}

function aggregateByEndpoint(endpoint: string, responses: any[]): any {
  if (responses.length === 1) return responses[0];

  if (endpoint === 'stats') {
    return mergeStats(responses);
  }

  if (endpoint === 'pageviews') {
    return {
      pageviews: mergeMetricEntries(responses.map((r) => r?.pageviews ?? [])),
      sessions: mergeMetricEntries(responses.map((r) => r?.sessions ?? [])),
    };
  }

  if (endpoint === 'events/series') {
    return mergeMetricEntries(responses);
  }

  if (endpoint === 'event-data/values') {
    const merged = new Map<string, number>();

    for (const response of responses) {
      for (const row of response ?? []) {
        const value = String(row?.value ?? '').trim();
        if (!value) continue;
        merged.set(value, (merged.get(value) ?? 0) + (Number(row?.total) || 0));
      }
    }

    const values = Array.from(merged, ([value, total]) => ({
      value,
      total,
    }));

    values.sort((a, b) => b.total - a.total);
    return values;
  }

  if (endpoint === 'metrics/expanded') {
    return mergeMetricsExpanded(responses);
  }

  if (endpoint === 'sessions') {
    return {
      data: responses.flatMap((r) => r?.data ?? []),
    };
  }

  return responses[0];
}

export const umamiProxy: Endpoint = {
  path: '/umami-proxy',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const umamiApiUrl = process.env.UMAMI_API_URL;

    if (!umamiApiUrl) {
      return Response.json(
        {
          error:
            'Umami is not configured. Please set UMAMI_API_URL, UMAMI_USERNAME and UMAMI_PASSWORD environment variables.',
        },
        { status: 503 },
      );
    }

    const { query } = req;
    const endpoint = query?.endpoint as string | undefined;

    if (
      !endpoint ||
      !(ALLOWED_ENDPOINTS as ReadonlyArray<string>).includes(endpoint)
    ) {
      return Response.json(
        { error: 'Invalid endpoint parameter' },
        { status: 400 },
      );
    }

    const forwardedParams = new URLSearchParams();
    for (const param of ALLOWED_PARAMS) {
      const value = query?.[param] as string | undefined;
      if (value) forwardedParams.set(param, value);
    }

    const tenantId = query?.tenantId as string | undefined;

    if (!tenantId) {
      return Response.json(
        { error: 'Missing tenantId parameter.' },
        { status: 400 },
      );
    }

    const userTenantIDs = getUserTenantIDs(req.user);
    const canReadAnyTenant = isSuperAdmin(req.user) || isSupport(req.user);

    if (!canReadAnyTenant && !userTenantIDs.includes(tenantId)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let tenant: any;

    try {
      tenant = await req.payload.findByID({
        collection: 'tenants',
        id: tenantId,
        overrideAccess: true,
      });
    } catch {
      console.warn(`[umamiProxy] Failed to look up tenant "${tenantId}".`);
      return Response.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const allowedWebsiteIds = configuredWebsiteIds(tenant);

    if (allowedWebsiteIds.length === 0) {
      return Response.json(
        { error: 'No Umami website IDs configured for this tenant.' },
        { status: 503 },
      );
    }

    const requestedWebsiteIds = parseRequestedWebsiteIds(
      query?.websiteIds as string | undefined,
    );

    const selectedWebsiteIds =
      requestedWebsiteIds.length > 0
        ? requestedWebsiteIds
        : [allowedWebsiteIds[0]];

    const invalidWebsiteIds = selectedWebsiteIds.filter(
      (websiteId) => !allowedWebsiteIds.includes(websiteId),
    );

    if (invalidWebsiteIds.length > 0) {
      return Response.json(
        {
          error:
            'Some requested website IDs are not configured for this tenant.',
          invalidWebsiteIds,
        },
        { status: 400 },
      );
    }

    let token: string;
    try {
      token = await getUmamiToken(umamiApiUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Umami authentication failed', detail: message },
        { status: 502 },
      );
    }

    try {
      const qs = forwardedParams.toString();

      const responses = await Promise.all(
        selectedWebsiteIds.map(async (websiteId) => {
          const apiPath = `/api/websites/${websiteId}/${endpoint}`;
          const targetUrl = `${umamiApiUrl}${apiPath}${qs ? `?${qs}` : ''}`;

          const response = await fetch(targetUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(10_000),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(
              `Umami API error for website ${websiteId} (${response.status}): ${body}`,
            );
          }

          return response.json();
        }),
      );

      const aggregated = aggregateByEndpoint(endpoint, responses);
      return Response.json(aggregated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Failed to reach Umami API', detail: message },
        { status: 502 },
      );
    }
  },
};
