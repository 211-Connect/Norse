import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      type: 'text',
      name: 'firstName',
      label: 'First Name',
    },
    {
      type: 'text',
      name: 'lastName',
      label: 'Last Name',
    },
    {
      type: 'select',
      name: 'role',
      label: 'Role',
      defaultValue: 'user',
      options: [
        {
          label: 'User',
          value: 'user',
        },
        {
          label: 'Publisher',
          value: 'publisher',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Super Admin',
          value: 'super-admin',
        },
      ],
    },
    {
      type: 'text',
      name: 'tenantId',
      label: 'Tenant ID',
      hidden: true,
    },
  ],
};
