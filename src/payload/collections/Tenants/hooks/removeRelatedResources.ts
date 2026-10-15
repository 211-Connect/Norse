import { PayloadRequest, Where } from 'payload';
import { extractID } from 'payload/shared';

import { createLogger } from '@/lib/logger';

import { getTenantMediaFieldPaths } from '../../TenantMedia/utilities/tenantMediaFields';

const log = createLogger('removeRelatedResources');

export const removeRelatedResources = async ({
  req,
  id,
}: {
  req: PayloadRequest;
  id: string | number;
}): Promise<void> => {
  const { payload } = req;

  log.info({ tenantId: id }, 'Deleting tenant and related data');

  const resourceDirs = await payload.find({
    collection: 'resource-directories',
    where: {
      tenant: {
        equals: id,
      },
    },
    limit: 1000,
    depth: 0,
    req,
  });

  for (const doc of resourceDirs.docs) {
    await payload.delete({
      collection: 'resource-directories',
      id: doc.id,
      req,
    });
    log.info(
      { tenantId: id, resourceDirectoryId: doc.id },
      'Resource directory deleted',
    );
  }

  const media = await payload.find({
    collection: 'tenant-media',
    where: {
      tenant: {
        equals: id,
      },
    },
    limit: 1000,
    depth: 0,
    req,
  });

  for (const file of media.docs) {
    // Duplicated tenants can still reference the original tenant's media.
    // Hand the file over instead of deleting it (which would also remove it
    // from S3); its `prefix` is kept, so its URL keeps working.
    const newOwnerTenantId = await findOtherTenantUsingMedia(req, file.id);

    if (newOwnerTenantId) {
      await payload.update({
        collection: 'tenant-media',
        id: file.id,
        data: { tenant: newOwnerTenantId },
        depth: 0,
        req,
      });
      log.info(
        { tenantId: id, mediaId: file.id, newOwnerTenantId },
        'Media still in use by another tenant, ownership transferred',
      );
      continue;
    }

    await payload.delete({
      collection: 'tenant-media',
      id: file.id,
      req,
    });
    log.info({ tenantId: id, mediaId: file.id }, 'Media deleted');
  }

  log.info({ tenantId: id }, 'Tenant and related data deleted');
};

/**
 * Returns the tenant of a resource directory that references the media,
 * preferring live documents over saved versions. The deleted tenant's own
 * resource directories (and their versions) are already gone at this point.
 */
async function findOtherTenantUsingMedia(
  req: PayloadRequest,
  mediaId: number,
): Promise<string | null> {
  const { payload } = req;
  const paths = getTenantMediaFieldPaths(
    payload.collections['resource-directories'].config.flattenedFields,
  );

  const { docs } = await payload.find({
    collection: 'resource-directories',
    where: {
      or: paths.map((path): Where => ({ [path]: { equals: mediaId } })),
    },
    limit: 1,
    depth: 0,
    req,
  });

  if (docs[0]?.tenant) {
    return extractID(docs[0].tenant);
  }

  const { docs: versions } = await payload.findVersions({
    collection: 'resource-directories',
    where: {
      or: paths.map((path): Where => ({
        [`version.${path}`]: { equals: mediaId },
      })),
    },
    limit: 1,
    depth: 0,
    req,
  });

  const versionTenant = versions[0]?.version.tenant;

  return versionTenant ? extractID(versionTenant) : null;
}
