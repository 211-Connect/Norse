import { randomUUID } from 'crypto';
import type { Endpoint, PayloadRequest } from 'payload';

import { createLogger } from '@/lib/logger';

import {
  collectTenantMediaIDs,
  getTenantMediaFieldPaths,
  mapTenantMediaIDs,
} from '../collections/TenantMedia/utilities/tenantMediaFields';
import { isSuperAdmin } from '../collections/Users/access/roles';
import { ResourceDirectory, Tenant, TenantMedia } from '../payload-types';
import { generateRandomKey } from '../utilities';

const log = createLogger('duplicateTenant');

/**
 * Copies a tenant-media file (and its S3 object) into another tenant, so the
 * duplicate doesn't depend on media owned by the original tenant.
 */
async function duplicateTenantMedia(
  req: PayloadRequest,
  mediaId: TenantMedia['id'],
  tenantId: string,
): Promise<TenantMedia['id']> {
  const media = await req.payload.findByID({
    collection: 'tenant-media',
    id: mediaId,
    depth: 0,
  });

  if (!media.url || !media.filename) {
    throw new Error(`Tenant media ${mediaId} has no file to copy`);
  }

  const response = await fetch(media.url);

  if (!response.ok) {
    throw new Error(
      `Failed to download tenant media ${mediaId}: ${response.status}`,
    );
  }

  const data = Buffer.from(await response.arrayBuffer());

  const copy = await req.payload.create({
    collection: 'tenant-media',
    data: { tenant: tenantId },
    file: {
      data,
      mimetype:
        media.mimeType ??
        response.headers.get('content-type') ??
        'application/octet-stream',
      name: media.filename,
      size: data.length,
    },
    depth: 0,
  });

  return copy.id;
}

/**
 * Points the duplicated resource directory's uploads at copies of the media
 * owned by the new tenant. Upload fields aren't localized, but the tabs that
 * hold them are written back in one locale, so they're read without fallback
 * to leave the other locales untouched.
 */
async function remapDuplicatedMedia(
  req: PayloadRequest,
  resourceDirectoryId: ResourceDirectory['id'],
  tenant: Tenant,
): Promise<void> {
  const fields =
    req.payload.collections['resource-directories'].config.flattenedFields;
  const locale = tenant.defaultLocale ?? tenant.enabledLocales[0];

  const resourceDirectory = await req.payload.findByID({
    collection: 'resource-directories',
    id: resourceDirectoryId,
    depth: 0,
    locale,
    fallbackLocale: false,
  });

  const mediaIdMap = new Map<TenantMedia['id'], TenantMedia['id']>();

  for (const mediaId of collectTenantMediaIDs(resourceDirectory, fields)) {
    mediaIdMap.set(
      mediaId,
      await duplicateTenantMedia(req, mediaId, tenant.id),
    );
  }

  if (mediaIdMap.size === 0) {
    return;
  }

  mapTenantMediaIDs(
    resourceDirectory,
    fields,
    (mediaId) => mediaIdMap.get(mediaId) ?? mediaId,
  );

  const topLevelKeys = new Set(
    getTenantMediaFieldPaths(fields).map((path) => path.split('.')[0]),
  );
  const data = Object.fromEntries(
    Object.entries(resourceDirectory).filter(([key]) => topLevelKeys.has(key)),
  );

  await req.payload.update({
    collection: 'resource-directories',
    id: resourceDirectoryId,
    data,
    depth: 0,
    locale,
  });
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
          depth: 0,
        });

        if (resourceDirectories.length > 0) {
          const originalRD = resourceDirectories[0];

          // `duplicate` copies every locale and gives array rows fresh IDs
          const newRD = await req.payload.duplicate({
            collection: 'resource-directories',
            id: originalRD.id,
            data: {
              name: `${originalRD.name} - copy`,
              tenant: newTenant.id,
            },
            depth: 0,
          });

          await remapDuplicatedMedia(req, newRD.id, newTenant);

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
