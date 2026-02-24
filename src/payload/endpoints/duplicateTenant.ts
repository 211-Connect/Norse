import type { Endpoint } from 'payload';
import { isSuperAdmin } from '../collections/Users/access/roles';
import { generateRandomKey } from '../utilities';
import { randomUUID } from 'crypto';
import { ResourceDirectory, Tenant } from '../payload-types';
import { createLogger } from '@/lib/logger';

const log = createLogger('duplicateTenant');

/**
 * Recursively regenerate all id fields in nested objects and arrays.
 */
function regenerateIds<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => regenerateIds(item)) as T;
  }

  if (typeof obj === 'object') {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === 'id' && typeof obj[key] === 'string') {
          newObj[key] = randomUUID();
        } else {
          newObj[key] = regenerateIds(obj[key]);
        }
      }
    }
    return newObj as T;
  }

  return obj;
}

export const duplicateTenant: Endpoint = {
  path: '/duplicate-tenant',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 },
      );
    }

    if (!isSuperAdmin(req.user)) {
      return Response.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 },
      );
    }

    try {
      const body = await req.json?.();
      const { tenantId } = body || {};

      if (!tenantId || typeof tenantId !== 'string') {
        return Response.json(
          { error: 'Tenant ID is required' },
          { status: 400 },
        );
      }

      const originalTenant = await req.payload.findByID({
        collection: 'tenants',
        id: tenantId,
      });

      if (!originalTenant) {
        return Response.json({ error: 'Tenant not found' }, { status: 404 });
      }

      const newTenantName = `${originalTenant.name} - copy`;
      const newNextAuthSecret = generateRandomKey();

      const hasResourceDirectory =
        originalTenant.services?.resourceDirectory || false;

      const data: Tenant = {
        ...originalTenant,
        id: randomUUID(),
        name: newTenantName,
        trustedDomains:
          originalTenant.trustedDomains?.map((domain) => ({
            id: randomUUID(),
            domain: domain.domain,
          })) || [],
        services: {
          resourceDirectory: false, // temporarily disabled to avoid validation error
        },
        auth: {
          ...originalTenant.auth,
          nextAuthSecret: newNextAuthSecret,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newTenant = await req.payload.create({
        collection: 'tenants',
        data,
      });

      if (hasResourceDirectory) {
        const { docs: resourceDirectories } = await req.payload.find({
          collection: 'resource-directories',
          where: { tenant: { equals: tenantId } },
          limit: 1,
        });

        if (resourceDirectories.length > 0) {
          const originalRD = resourceDirectories[0];

          const { id, tenant, ...rdData } = originalRD;

          // `payload.create` requires unique IDs for all sub-documents
          const processedData = regenerateIds<ResourceDirectory>({
            ...rdData,
            name: `${originalRD.name} - copy`,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          const data: ResourceDirectory = {
            ...processedData,
            tenant: newTenant.id,
          };

          await req.payload.create({
            collection: 'resource-directories',
            data,
          });

          await req.payload.update({
            collection: 'tenants',
            id: newTenant.id,
            data: {
              services: {
                resourceDirectory: true,
              },
            },
          });
        }
      }

      return Response.json(
        {
          success: true,
          tenant: { id: newTenant.id, name: newTenant.name },
        },
        { status: 200 },
      );
    } catch (error) {
      log.error({ err: error }, 'Error duplicating tenant');
      return Response.json(
        {
          error: 'Failed to duplicate tenant',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }
  },
};
