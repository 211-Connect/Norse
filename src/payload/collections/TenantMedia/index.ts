import type { CollectionConfig } from 'payload';
import { setTenantIdPrefix } from './hooks/setTenantIdPrefix';

export const TenantMedia: CollectionConfig = {
  slug: 'tenant-media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  access: {
    read: () => true,
  },
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 250,
        height: undefined,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/xml'],
  },
  fields: [],
  hooks: {
    beforeOperation: [setTenantIdPrefix],
  },
};
