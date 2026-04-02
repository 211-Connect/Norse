import type { CollectionConfig } from 'payload';

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
    read: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [],
};
