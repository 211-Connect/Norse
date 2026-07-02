import type { Endpoint } from 'payload';

import { isSuperAdmin, isSupport } from '../collections/Users/access/roles';
import { getConfiguredWebsiteIds } from '../utilities/getConfiguredWebsiteIds';
import { getUserTenantIDs } from '../utilities/getUserTenantIDs';
import { getUmamiToken } from '../utilities/umamiAuth';
import { FETCH_TIMEOUT } from '@/app/(app)/shared/lib/constants';

type UmamiWebsite = {
  id: string;
  name: string | null;
};

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

export const umamiWebsites: Endpoint = {
  path: '/umami-websites',
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

    const tenantId = req.query?.tenantId as string | undefined;
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
      return Response.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    const allowedWebsiteIds = getConfiguredWebsiteIds(tenant?.analytics);
    if (allowedWebsiteIds.length === 0) {
      return Response.json({ websites: [] as UmamiWebsite[] });
    }

    const requestedWebsiteIds = parseRequestedWebsiteIds(
      req.query?.websiteIds as string | undefined,
    );

    const selectedWebsiteIds =
      requestedWebsiteIds.length > 0 ? requestedWebsiteIds : allowedWebsiteIds;

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

    const websites = await Promise.all(
      selectedWebsiteIds.map(async (websiteId): Promise<UmamiWebsite> => {
        try {
          const response = await fetch(
            `${umamiApiUrl}/api/websites/${websiteId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(FETCH_TIMEOUT),
            },
          );

          if (!response.ok) {
            return { id: websiteId, name: null };
          }

          const data = (await response.json()) as { name?: string | null };
          return {
            id: websiteId,
            name: data.name?.trim() || null,
          };
        } catch {
          return { id: websiteId, name: null };
        }
      }),
    );

    return Response.json({ websites });
  },
};
