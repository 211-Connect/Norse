import { CollectionAfterDeleteHook } from 'payload';
import { ResourceDirectory } from '@/payload/payload-types';
import { extractID } from 'payload/shared';

export const disableService: CollectionAfterDeleteHook<
  ResourceDirectory
> = async ({ doc, req }) => {
  if (!doc.tenant) {
    return doc;
  }

  const tenantId = extractID(doc.tenant);

  try {
    await req.payload.update({
      collection: 'tenants',
      id: tenantId,
      data: {
        services: {
          resourceDirectory: false,
        },
      },
    });
  } catch (error) {
    req.payload.logger.error(
      `Failed to disable resource directory service for tenant ${tenantId}: ${error}`,
    );

    throw error;
  }

  return doc;
};
