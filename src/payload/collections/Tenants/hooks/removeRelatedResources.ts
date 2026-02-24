import { PayloadRequest } from 'payload';
import { createLogger } from '@/lib/logger';

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
  });

  for (const doc of resourceDirs.docs) {
    await payload.delete({
      collection: 'resource-directories',
      id: doc.id,
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
  });

  for (const file of media.docs) {
    await payload.delete({
      collection: 'tenant-media',
      id: file.id,
    });
    log.info({ tenantId: id, mediaId: file.id }, 'Media deleted');
  }

  log.info({ tenantId: id }, 'Tenant and related data deleted');
};
