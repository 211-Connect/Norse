import type { CollectionConfig } from 'payload';

import { invalidateApiCache } from '../ResourceDirectories/hooks/invalidateApiCache';
import { setTenantIdAsId } from '../ResourceDirectories/hooks/setTenantIdAsId';
import { superAdminAccess } from '../Users/access/roles';
import { pushOrchestrationConfigToCache } from './hooks/pushOrchestrationConfigToCache';
import { schemas } from './tabs/schemas';

export const OrchestrationConfig: CollectionConfig = {
  slug: 'orchestration-config',
  // Shortened database name to avoid 63 character limit for enum names
  dbName: 'oc',
  access: {
    create: superAdminAccess,
    read: superAdminAccess,
    update: superAdminAccess,
    delete: superAdminAccess,
  },
  labels: {
    singular: 'Orchestration Config',
    plural: 'Orchestration Config',
  },
  versions: {
    drafts: false,
  },
  hooks: {
    beforeChange: [setTenantIdAsId],
    afterChange: [pushOrchestrationConfigToCache, invalidateApiCache],
  },
  fields: [
    {
      type: 'ui',
      name: 'tenantHeader',
      admin: {
        position: 'above',
        components: {
          Field:
            '@/payload/collections/OrchestrationConfig/components/TenantHeader',
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
    {
      type: 'tabs',
      tabs: [schemas],
    },
  ],
};
