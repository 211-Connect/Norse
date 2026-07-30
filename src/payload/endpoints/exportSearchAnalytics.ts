import type { Endpoint } from 'payload';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { analyticsApiClient } from '@/lib/api/clients';
import { resolveAnalyticsContext } from '../utilities/resolveAnalyticsContext';
import { SearchEventExportRow } from '../../lib/api/generated/data-contracts';

dayjs.extend(utc);

function toISO(ms: string | undefined): string {
  if (!ms) return '';
  const clamped = Math.min(Number(ms), Date.now());
  return new Date(clamped).toISOString();
}

function escapeCSVField(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (
    str.includes('"') ||
    str.includes(',') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(rows: SearchEventExportRow[]): string {
  const headers = [
    'Timestamp',
    'Anonymous User ID',
    'Session ID',
    'Query Label',
    'Query Type',
    'Search Latitude',
    'Search Longitude',
    'Search City',
    'Search ZIP Code',
    'User Latitude',
    'User Longitude',
    'User City',
    'User ZIP Code',
  ];

  const lines: string[] = [headers.map(escapeCSVField).join(',')];

  for (const row of rows) {
    lines.push(
      [
        escapeCSVField(row.timestamp),
        escapeCSVField(row.userId ?? ''),
        escapeCSVField(row.sessionId ?? ''),
        escapeCSVField(row.queryLabel),
        escapeCSVField(row.queryType),
        escapeCSVField(row.searchLatitude ?? ''),
        escapeCSVField(row.searchLongitude ?? ''),
        escapeCSVField(row.searchCity ?? ''),
        escapeCSVField(row.searchZipCode ?? ''),
        escapeCSVField(row.userLatitude ?? ''),
        escapeCSVField(row.userLongitude ?? ''),
        escapeCSVField(row.userCity ?? ''),
        escapeCSVField(row.userZipCode ?? ''),
      ].join(','),
    );
  }

  return lines.join('\r\n');
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
            headers: {
              'x-analytics-api-key': ctx.apiKey,
              'x-tenant-id': tenantId as string,
              'x-api-version': '1',
            },
          },
        );

      if (!response.data) {
        return Response.json(
          { error: 'Failed to export search analytics from Norse API.' },
          { status: 502 },
        );
      }

      const rows = response.data.data ?? [];

      const csv = buildCSV(rows);

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
