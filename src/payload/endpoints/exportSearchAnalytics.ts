import type { Endpoint } from 'payload';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { analyticsApiClient } from '@/lib/api/clients';
import { resolveAnalyticsContext } from '../utilities/resolveAnalyticsContext';
import { getApiHeaders } from '@/lib/api';

dayjs.extend(utc);

function toISO(ms: string | undefined): string {
  if (!ms) return '';
  const clamped = Math.min(Number(ms), Date.now());
  return new Date(clamped).toISOString();
}

export const exportSearchAnalytics: Endpoint = {
  path: '/export-search-analytics',
  method: 'get',
  handler: async (req) => {
    const { query } = req;
    const startAt = query?.startAt as string | undefined;
    const endAt = query?.endAt as string | undefined;
    const tenantId = query?.tenantId as string | undefined;

    if (!startAt || !endAt) {
      return Response.json(
        { error: 'Missing startAt or endAt parameters.' },
        { status: 400 },
      );
    }

    const ctx = await resolveAnalyticsContext(req);
    if (ctx instanceof Response) return ctx;

    try {
      const start = toISO(startAt);
      const end = toISO(endAt);
      const websiteIdsParam = ctx.selectedWebsiteIds.join(',');

      const response =
        await analyticsApiClient.analyticsControllerGetExportSearchData(
          {
            start,
            end,
            websiteIds: websiteIdsParam,
          },
          {
            format: 'text',
            headers: {
              Accept: 'text/csv',
              'x-analytics-api-key': ctx.apiKey,
              ...(await getApiHeaders(tenantId || '')),
            },
          },
        );

      const csv: unknown = response.data;
      if (typeof csv !== 'string') {
        return Response.json(
          { error: 'Failed to export search analytics from Norse API.' },
          { status: 502 },
        );
      }

      const startLabel = dayjs.utc(Number(startAt)).format('YYYY-MM-DD');
      const endLabel = dayjs.utc(Number(endAt)).format('YYYY-MM-DD');
      const filename = `search-analytics-${startLabel}-${endLabel}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Failed to export analytics', detail: message },
        { status: 502 },
      );
    }
  },
};
