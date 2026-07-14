import type { Endpoint } from 'payload';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { analyticsApiClient } from '@/lib/api/clients';
import { isSuperAdmin, isSupport } from '../collections/Users/access/roles';
import { getConfiguredWebsiteIds } from '../utilities/getConfiguredWebsiteIds';
import { getUserTenantIDs } from '../utilities/getUserTenantIDs';
import { Tenant } from '../payload-types';

dayjs.extend(utc);

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

function buildCSV(
  rows: Array<{
    timestamp: string;
    queryLabel: string;
    queryType: string;
    coordinates: any;
    zipCode: any;
  }>,
): string {
  const headers = [
    'Timestamp',
    'Query Label',
    'Query Type',
    'Coordinates',
    'ZIP Code',
  ];

  const lines: string[] = [headers.map(escapeCSVField).join(',')];

  for (const row of rows) {
    lines.push(
      [
        escapeCSVField(row.timestamp),
        escapeCSVField(row.queryLabel),
        escapeCSVField(row.queryType),
        escapeCSVField(row.coordinates),
        escapeCSVField(row.zipCode ?? ''),
      ].join(','),
    );
  }

  return lines.join('\r\n');
}

export const exportSearchAnalytics: Endpoint = {
  path: '/export-search-analytics',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    let tenant: Tenant;
    try {
      tenant = await req.payload.findByID({
        collection: 'tenants',
        id: tenantId,
        overrideAccess: true,
      });
    } catch {
      return Response.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const analyticsApiKey = tenant?.analytics?.apiKey;
    if (!analyticsApiKey) {
      return Response.json(
        {
          error: `Analytics API key not configured for tenant ${tenantId}. Please configure in Tenant settings.`,
        },
        { status: 503 },
      );
    }

    const allowedWebsiteIds = getConfiguredWebsiteIds(tenant?.analytics);
    if (allowedWebsiteIds.length === 0) {
      return Response.json(
        { error: 'No Umami website IDs configured for this tenant.' },
        { status: 503 },
      );
    }

    const rawWebsiteIds = query?.websiteIds as string | undefined;
    const requestedWebsiteIds = rawWebsiteIds
      ? Array.from(
          new Set(
            rawWebsiteIds
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean),
          ),
        )
      : [];

    const selectedWebsiteIds =
      requestedWebsiteIds.length > 0
        ? requestedWebsiteIds
        : [allowedWebsiteIds[0]];

    const invalidIds = selectedWebsiteIds.filter(
      (id) => !allowedWebsiteIds.includes(id),
    );
    if (invalidIds.length > 0) {
      return Response.json(
        {
          error:
            'Some requested website IDs are not configured for this tenant.',
          invalidIds,
        },
        { status: 400 },
      );
    }

    try {
      const start = new Date(Number(startAt)).toISOString();
      const end = new Date(Number(endAt)).toISOString();

      const websiteIdsParam = selectedWebsiteIds.join(',');

      const response =
        await analyticsApiClient.analyticsControllerGetExportSearchData(
          {
            start,
            end,
            websiteIds: websiteIdsParam,
          },
          {
            headers: {
              'x-analytics-api-key': analyticsApiKey,
              'x-tenant-id': tenantId,
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
