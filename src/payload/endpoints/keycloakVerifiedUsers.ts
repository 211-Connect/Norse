import type { Endpoint } from 'payload';

import { isSuperAdmin, isSupport } from '../collections/Users/access/roles';
import type { Tenant } from '../payload-types';
import { getUserTenantIDs } from '../utilities/getUserTenantIDs';
import { getVerifiedEnabledUsersCount } from '../utilities/keycloakAdmin';

export const keycloakVerifiedUsers: Endpoint = {
  path: '/keycloak-verified-users',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

    const realmId = tenant?.auth?.realmId?.trim();

    if (!realmId) {
      return Response.json(
        { error: 'Tenant has no configured Keycloak realm.' },
        { status: 503 },
      );
    }

    try {
      const verifiedUsers = await getVerifiedEnabledUsersCount(realmId);
      return Response.json({ verifiedUsers });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Failed to reach Keycloak Admin API', detail: message },
        { status: 502 },
      );
    }
  },
};
