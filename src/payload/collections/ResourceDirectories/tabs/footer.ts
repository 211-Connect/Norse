import { generateUrlFields } from '@/payload/fields/urlField';
import { Tab } from 'payload';

import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

export const footer: Tab = {
  name: 'footer',
  fields: [
    {
      name: 'disclaimer',
      type: 'textarea',
      localized: true,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
    },
    {
      name: 'customMenu',
      type: 'array',
      localized: true,
      labels: {
        singular: 'Menu Item',
        plural: 'Menu Items',
      },
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        ...generateUrlFields('href'),
      ],
    },
  ],
};
