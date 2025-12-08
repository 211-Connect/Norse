import { PayloadRequest } from 'payload';

export const removeRelatedResources = async ({
  req,
  id,
}: {
  req: PayloadRequest;
  id: string | number;
}): Promise<void> => {
  const { payload } = req;

  console.log(`🗑️ Usuwam tenant ${id} i powiązane dane...`);

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
    console.log(`✅ Usunięto resource directory: ${doc.id}`);
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
    console.log(`✅ Usunięto media: ${file.id}`);
  }

  console.log(`✅ Tenant ${id} i powiązane dane usunięte`);
};
