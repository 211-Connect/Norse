import { apiConfigCacheService } from '@/cacheService';

import { isSuperAdmin, isSupport } from '../collections/Users/access/roles';
import { getConfiguredWebsiteIds, TenantAnalytics } from './getConfiguredWebsiteIds';
import { getUserTenantIDs } from './getUserTenantIDs';

type ResolveOptions = {
  skipWebsiteIdValidation?: boolean;
};

type AnalyticsContext = {
  apiKey: string;
  selectedWebsiteIds: string[];
};

export async function resolveAnalyticsContext(
  req: any,
  options: ResolveOptions = {},
): Promise<AnalyticsContext | Response> {
  if (!req.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query } = req;
  const tenantId = query?.tenantId as string | undefined;

  if (!tenantId) {
    return Response.json({ error: 'Missing tenantId parameter.' }, { status: 400 });
  }

  const userTenantIDs = getUserTenantIDs(req.user);
  const canReadAnyTenant = isSuperAdmin(req.user) || isSupport(req.user);

  if (!canReadAnyTenant && !userTenantIDs.includes(tenantId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let analytics: TenantAnalytics | null | undefined;
  let apiKey: string | undefined;

  try {
    const cached = await apiConfigCacheService.get(`analytics_config:${tenantId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as {
        umamiWebsiteId?: string | null;
        additionalWebsiteIds?: { websiteId?: string | null }[] | null;
        apiKey?: string | null;
      };
      analytics = {
        umamiWebsiteId: parsed.umamiWebsiteId,
        additionalWebsiteIds: parsed.additionalWebsiteIds,
      };
      apiKey = parsed.apiKey ?? undefined;
    }
  } catch {
    // Redis miss or parse error — fall through to findByID
  }

  if (!analytics || !apiKey) {
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

    analytics = tenant?.analytics;
    apiKey = tenant?.analytics?.apiKey as string | undefined;

    // Re-warm the Redis cache so subsequent requests hit
    if (apiKey) {
      apiConfigCacheService.set(
        `analytics_config:${tenantId}`,
        JSON.stringify({
          additionalWebsiteIds: analytics?.additionalWebsiteIds,
          umamiWebsiteId: analytics?.umamiWebsiteId,
          apiKey,
        }),
      ).catch(() => {
        // Fire-and-forget; non-critical
      });
    }
  }

  if (!apiKey) {
    return Response.json(
      {
        error: `Analytics API key not configured for tenant ${tenantId}. Please configure in Tenant settings.`,
      },
      { status: 503 },
    );
  }

  if (options.skipWebsiteIdValidation) {
    return { apiKey, selectedWebsiteIds: [] };
  }

  const allowedWebsiteIds = getConfiguredWebsiteIds(analytics);
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

  return { apiKey, selectedWebsiteIds };
}
