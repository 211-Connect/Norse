import type { CollectionConfig } from 'payload';
import { v4 as uuid } from 'uuid';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'tenantId',
      type: 'text',
      index: true,
      defaultValue: uuid(),
      required: true,
    },
  ],
};
