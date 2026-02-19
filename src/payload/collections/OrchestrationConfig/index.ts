import type { CollectionConfig } from 'payload';
import { isSuperAdminAccess } from '../Users/access/roles';
import { schemas } from './tabs/schemas';
import { pushOrchestrationConfigToCache } from './hooks/pushOrchestrationConfigToCache';
import { setTenantIdAsId } from '../ResourceDirectories/hooks/setTenantIdAsId';

export const OrchestrationConfig: CollectionConfig = {
  slug: 'orchestration-config',
  // Shortened database name to avoid 63 character limit for enum names
  dbName: 'oc',
  access: {
    create: isSuperAdminAccess,
    read: isSuperAdminAccess,
    update: isSuperAdminAccess,
    delete: isSuperAdminAccess,
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
    afterChange: [pushOrchestrationConfigToCache],
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
