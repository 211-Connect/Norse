import type { CollectionConfig } from 'payload';
import { isSuperAdminAccess } from '../Users/access/roles';

export const Analytics: CollectionConfig = {
  slug: 'analytics',
  labels: {
    singular: 'Analytics',
    plural: 'Analytics',
  },
  admin: {
    components: {
      views: {
        list: {
          Component:
            '@/payload/collections/Analytics/components/AnalyticsDashboard',
        },
      },
    },
  },
  access: {
    create: () => false,
    read: isSuperAdminAccess,
    update: () => false,
    delete: () => false,
  },
  fields: [],
};
