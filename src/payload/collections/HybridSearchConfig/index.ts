import type { CollectionConfig } from 'payload';

import { invalidateApiCache } from '../ResourceDirectories/hooks/invalidateApiCache';
import { setTenantIdAsId } from '../ResourceDirectories/hooks/setTenantIdAsId';
import { superAdminAccess } from '../Users/access/roles';
import { pushHybridSearchConfigToCacheAfterChangeHook } from './hooks/pushHybridSearchConfigToCache';

export const HybridSearchConfig: CollectionConfig = {
  slug: 'hybrid-search-config',
  // Shortened database name to avoid 63 character limit for enum names
  dbName: 'hsc',
  access: {
    create: superAdminAccess,
    read: superAdminAccess,
    update: superAdminAccess,
    delete: superAdminAccess,
  },
  labels: {
    singular: 'Hybrid Search Config',
    plural: 'Hybrid Search Config',
  },
  versions: {
    drafts: false,
  },
  hooks: {
    beforeChange: [setTenantIdAsId],
    afterChange: [
      pushHybridSearchConfigToCacheAfterChangeHook,
      invalidateApiCache,
    ],
  },
  fields: [
    {
      type: 'ui',
      name: 'tenantHeader',
      admin: {
        position: 'above',
        components: {
          Field:
            '@/payload/collections/HybridSearchConfig/components/HybridSearchConfigHeader',
        },
      },
    },
    {
      name: 'id',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
  ],
};
